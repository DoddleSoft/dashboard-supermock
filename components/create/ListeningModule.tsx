import { Plus, Upload, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useEffect } from "react";

interface Question {
  id: string;
  text: string;
  type: "fill-blank" | "mcq" | "true-false-not-given" | "yes-no-not-given";
  blankPosition?: "first" | "middle" | "end";
  mcqVariant?: "3-options-1-correct" | "5-options-2-correct";
  options?: string[];
  correctAnswers?: string[];
  answer?: string;
  explanation?: string;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
  audioFile?: File | null;
}

interface ListeningModuleProps {
  sections: Section[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddQuestion: (sectionId: string) => void;
  onDeleteQuestion: (sectionId: string, questionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onUpdateSectionAudio: (sectionId: string, file: File | null) => void;
}

export default function ListeningModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateSectionTitle,
  onUpdateSectionAudio,
}: ListeningModuleProps) {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const animationRefs = useRef<{ [key: string]: number | null }>({});

  const handleAudioChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateSectionAudio(sectionId, file);
    }
  };

  const startDummyWaveform = (sectionId: string) => {
    const canvas = canvasRefs.current[sectionId];
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (animationRefs.current[sectionId]) {
      cancelAnimationFrame(animationRefs.current[sectionId]!);
    }

    let frame = 0;

    const draw = () => {
      const animId = requestAnimationFrame(draw);
      animationRefs.current[sectionId] = animId;

      const width = canvas.width;
      const height = canvas.height;
      ctx.fillStyle = "rgb(15 23 42)";
      ctx.fillRect(0, 0, width, height);

      const segments = Math.floor(width / 6);
      const slice = width / segments;

      for (let i = 0; i < segments; i++) {
        const progress = (i + frame * 0.02) % segments;
        const amplitude = 0.3 + Math.abs(Math.sin(progress * 0.3)) * 0.7;
        const barHeight = amplitude * height;
        const x = i * slice;
        const hue = 190 - (i / segments) * 80;

        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillRect(x, height - barHeight, slice - 1, barHeight);
      }

      frame += 1;
    };

    draw();
  };

  const stopDummyWaveform = (sectionId: string) => {
    if (animationRefs.current[sectionId]) {
      cancelAnimationFrame(animationRefs.current[sectionId]!);
      animationRefs.current[sectionId] = null;
    }
  };

  useEffect(() => {
    const audioElements = Object.entries(audioRefs.current);

    audioElements.forEach(([sectionId, audio]) => {
      if (!audio) return;

      const handlePlay = () => {
        startDummyWaveform(sectionId);
      };
      const handlePause = () => stopDummyWaveform(sectionId);
      const handleEnded = () => stopDummyWaveform(sectionId);

      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
      };
    });
  }, []);

  return (
    <div className="space-y-6 pb-4">
      {sections.map((section, sectionIndex) => (
        <div
          key={section.id}
          className="border border-slate-200 rounded-xl overflow-hidden"
        >
          {/* Section Header */}
          <div
            className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => onToggleSection(section.id)}
          >
            <input
              type="text"
              value={section.name}
              onChange={(e) => {
                e.stopPropagation();
                onUpdateSectionTitle(section.id, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-slate-600 uppercase tracking-wide bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
              placeholder="Section Title"
            />
            {expandedSections.includes(section.id) ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>

          {expandedSections.includes(section.id) && (
            <div className="p-6 space-y-6">
              {/* Audio Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Section Audio
                </label>
                {section.audioFile ? (
                  <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                      <p className="text-slate-900 font-medium text-sm">
                        {section.audioFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(section.audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <canvas
                      ref={(el) => {
                        if (el) canvasRefs.current[section.id] = el;
                      }}
                      width={400}
                      height={40}
                      className="w-full bg-slate-900"
                    />
                    <div className="p-4 bg-white">
                      <audio
                        id={`audio-${section.id}`}
                        ref={(el) => {
                          if (el) audioRefs.current[section.id] = el;
                        }}
                        controls
                        crossOrigin="anonymous"
                        className="w-full"
                        src={URL.createObjectURL(section.audioFile)}
                      />
                      <button
                        onClick={() => onUpdateSectionAudio(section.id, null)}
                        className="w-full mt-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        Remove Audio
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                    <input
                      type="file"
                      id={`audio-upload-${section.id}`}
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => handleAudioChange(e, section.id)}
                    />
                    <label
                      htmlFor={`audio-upload-${section.id}`}
                      className="cursor-pointer"
                    >
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">
                        Choose Audio File
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Upload MP3, WAV, or other audio formats
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Questions (Recommended: 10 per section)
                </label>
                <div className="space-y-3">
                  {section.questions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white"
                    >
                      <span className="text-sm font-semibold text-slate-600 mt-1">
                        {qIndex + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-900 text-sm">
                          {question.text}
                        </p>
                        {question.options && (
                          <div className="mt-2 space-y-1">
                            {question.options.map((opt, i) => (
                              <p key={i} className="text-sm text-slate-600">
                                {String.fromCharCode(65 + i)}. {opt}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          onDeleteQuestion(section.id, question.id)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => onAddQuestion(section.id)}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onAddSection}
        className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Section
      </button>
    </div>
  );
}
