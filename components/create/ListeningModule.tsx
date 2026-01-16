import { Plus, Upload, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  ListeningSection,
  QuestionDefinition,
} from "../../context/ModuleContext";

interface ListeningModuleProps {
  sections: ListeningSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddQuestion: (sectionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onUpdateSectionInstruction: (sectionId: string, instruction: string) => void;
  onUpdateSectionAudioPath: (sectionId: string, path: string) => void;
  onUpdateSectionAudio: (sectionId: string, file: File | null) => void;
  onAddRenderBlock: (sectionId: string) => void;
  onUpdateRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock
  ) => void;
  onDeleteRenderBlock: (sectionId: string, blockIndex: number) => void;
  onUpdateQuestionKey: (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition
  ) => void;
  onDeleteQuestionKey: (sectionId: string, questionRef: string) => void;
}

export default function ListeningModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onAddQuestion,
  onUpdateSectionTitle,
  onUpdateSectionInstruction,
  onUpdateSectionAudioPath,
  onUpdateSectionAudio,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
  onUpdateQuestionKey,
  onDeleteQuestionKey,
}: ListeningModuleProps) {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const animationRefs = useRef<{ [key: string]: number | null }>({});

  const [placeholderDrafts, setPlaceholderDrafts] = useState<
    Record<string, { number: string; type: "blanks" | "dropdown" | "boolean" }>
  >({});

  const blockTypes: RenderBlockType[] = [
    "header",
    "instruction",
    "title",
    "subtitle",
    "text",
    "image",
    "box",
  ];

  const getDraftKey = (sectionId: string, index: number) =>
    `${sectionId}:${index}`;

  const getDraft = (sectionId: string, index: number) => {
    const key = getDraftKey(sectionId, index);
    return placeholderDrafts[key] || { number: "", type: "blanks" as const };
  };

  const updateDraft = (
    sectionId: string,
    index: number,
    updates: Partial<{
      number: string;
      type: "blanks" | "dropdown" | "boolean";
    }>
  ) => {
    const key = getDraftKey(sectionId, index);
    setPlaceholderDrafts((prev) => ({
      ...prev,
      [key]: { ...getDraft(sectionId, index), ...updates },
    }));
  };

  const insertPlaceholder = (
    sectionId: string,
    index: number,
    block: RenderBlock
  ) => {
    const draft = getDraft(sectionId, index);
    if (!draft.number) return;
    const placeholder = `⟦Q${draft.number}:${draft.type}⟧`;
    const separator = block.content && !block.content.endsWith(" ") ? " " : "";
    onUpdateRenderBlock(sectionId, index, {
      ...block,
      content: toStorageContent(
        `${toDisplayContent(block.content)}${separator}${placeholder}`
      ),
    });
  };

  const toDisplayContent = (value: string) =>
    value.replace(/\{\{(\d+)\}(blanks|dropdown|boolean)\}\}/g, "⟦Q$1:$2⟧");

  const toStorageContent = (value: string) =>
    value.replace(/⟦Q(\d+):(blanks|dropdown|boolean)⟧/g, "{{$1}$2}");

  const updateQuestionField = (
    sectionId: string,
    questionRef: string,
    partial: Partial<QuestionDefinition>
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const current = section.questions[questionRef] || { answer: "" };
    onUpdateQuestionKey(sectionId, questionRef, { ...current, ...partial });
  };

  const sortedQuestionRefs = (questions: Record<string, QuestionDefinition>) =>
    Object.keys(questions).sort((a, b) => Number(a) - Number(b));

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
      {sections.map((section) => (
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
              value={section.title}
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
              {/* Instruction */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Instruction
                </label>
                <textarea
                  value={section.instruction || ""}
                  onChange={(e) =>
                    onUpdateSectionInstruction(section.id, e.target.value)
                  }
                  placeholder="Enter section instruction..."
                  className="w-full h-24 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none text-sm"
                />
              </div>

              {/* Audio Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Section Audio
                </label>
                <input
                  type="text"
                  value={section.audioPath || ""}
                  onChange={(e) =>
                    onUpdateSectionAudioPath(section.id, e.target.value)
                  }
                  placeholder="Audio URL/path (e.g. /section1.mpeg)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm mb-3"
                />
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

              {/* Render Blocks */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Render Blocks
                </label>
                <div className="space-y-3">
                  {section.renderBlocks.map((block, index) => (
                    <div
                      key={`${section.id}-block-${index}`}
                      className="border border-slate-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <select
                          value={block.type}
                          onChange={(e) =>
                            onUpdateRenderBlock(section.id, index, {
                              ...block,
                              type: e.target.value as RenderBlockType,
                            })
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          {blockTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onDeleteRenderBlock(section.id, index)}
                          className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        value={toDisplayContent(block.content)}
                        onChange={(e) =>
                          onUpdateRenderBlock(section.id, index, {
                            ...block,
                            content: toStorageContent(e.target.value),
                          })
                        }
                        placeholder="Type your content..."
                        rows={3}
                        className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                      />

                      {block.type === "text" && (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr_auto] items-center">
                          <input
                            type="number"
                            min={1}
                            value={getDraft(section.id, index).number}
                            onChange={(e) =>
                              updateDraft(section.id, index, {
                                number: e.target.value,
                              })
                            }
                            placeholder="Question #"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                          <select
                            value={getDraft(section.id, index).type}
                            onChange={(e) =>
                              updateDraft(section.id, index, {
                                type: e.target.value as
                                  | "blanks"
                                  | "dropdown"
                                  | "boolean",
                              })
                            }
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="blanks">Blanks</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="boolean">True/False</option>
                          </select>
                          <button
                            onClick={() =>
                              insertPlaceholder(section.id, index, block)
                            }
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
                          >
                            Insert
                          </button>
                        </div>
                      )}

                      {block.type === "image" && (
                        <input
                          type="text"
                          value={block.alt || ""}
                          onChange={(e) =>
                            onUpdateRenderBlock(section.id, index, {
                              ...block,
                              alt: e.target.value,
                            })
                          }
                          placeholder="Image alt text..."
                          className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => onAddRenderBlock(section.id)}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Render Block
                  </button>
                </div>
              </div>

              {/* Answer Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Answer Key
                </label>
                <div className="space-y-3">
                  {sortedQuestionRefs(section.questions).map((ref) => (
                    <div
                      key={`${section.id}-q-${ref}`}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_1fr_auto] items-start border border-slate-200 rounded-xl p-4 bg-white"
                    >
                      <input
                        value={ref}
                        readOnly
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                      />
                      <input
                        type="text"
                        value={section.questions[ref]?.answer || ""}
                        onChange={(e) =>
                          updateQuestionField(section.id, ref, {
                            answer: e.target.value,
                          })
                        }
                        placeholder="Correct answer"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={(section.questions[ref]?.options || []).join(
                          ", "
                        )}
                        onChange={(e) =>
                          updateQuestionField(section.id, ref, {
                            options: e.target.value
                              .split(",")
                              .map((opt) => opt.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Options (comma separated)"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => onDeleteQuestionKey(section.id, ref)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                    Add Question (Auto Block + Answer)
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
