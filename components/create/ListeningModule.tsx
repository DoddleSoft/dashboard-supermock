import { Plus, Upload, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  ListeningSection,
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
    block: RenderBlock,
  ) => void;
  onDeleteRenderBlock: (sectionId: string, blockIndex: number) => void;
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
}: ListeningModuleProps) {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const animationRefs = useRef<{ [key: string]: number | null }>({});

  const [placeholderDrafts, setPlaceholderDrafts] = useState<
    Record<string, { number: string; type: "blanks" | "dropdown" | "boolean" }>
  >({});

  const blockTypes: RenderBlockType[] = ["text", "image"];

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
    }>,
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
    block: RenderBlock,
  ) => {
    const draft = getDraft(sectionId, index);
    if (!draft.number) return;
    const placeholder = `⟦Q${draft.number}:${draft.type}⟧`;
    const separator = block.content && !block.content.endsWith(" ") ? " " : "";
    onUpdateRenderBlock(sectionId, index, {
      ...block,
      content: toStorageContent(
        `${toDisplayContent(block.content)}${separator}${placeholder}`,
      ),
    });
  };

  const toDisplayContent = (value: string) =>
    value.replace(/\{\{(\d+)\}(blanks|dropdown|boolean)\}\}/g, "⟦Q$1:$2⟧");

  const toStorageContent = (value: string) =>
    value.replace(/⟦Q(\d+):(blanks|dropdown|boolean)⟧/g, "{{$1}$2}");

  const handleImageFileChange = (
    sectionId: string,
    index: number,
    block: RenderBlock,
    file?: File | null,
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateRenderBlock(sectionId, index, {
        ...block,
        content: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
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
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Render Blocks
                </label>
                <div className="space-y-3">
                  {section.renderBlocks.map((block, index) => (
                    <div
                      key={`${section.id}-block-${index}`}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <select
                          value={block.type}
                          onChange={(e) =>
                            onUpdateRenderBlock(section.id, index, {
                              ...block,
                              type: e.target.value as RenderBlockType,
                            })
                          }
                          className="px-3 py-2 border border-slate-200 rounded-lg text-gray-700 text-sm bg-white"
                        >
                          {blockTypes.map((type) => (
                            <option
                              className="text-gray-700"
                              key={type}
                              value={type}
                            >
                              {type === "text" ? "Text block" : "Image block"}
                            </option>
                          ))}
                        </select>
                        <span className="text-md text-slate-900">
                          For question placeholder use {"{{1}mcq}"} format
                        </span>
                        <button
                          onClick={() => onDeleteRenderBlock(section.id, index)}
                          className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:gap-4">
                        <textarea
                          value={block.questions || ""}
                          onChange={(e) =>
                            onUpdateRenderBlock(section.id, index, {
                              ...block,
                              questions: e.target.value,
                            })
                          }
                          placeholder="e.g., Questions 1-7"
                          rows={3}
                          className="w-full p-3 border border-slate-200 rounded-lg text-gray-700 text-sm"
                        />

                        <textarea
                          value={block.instruction || ""}
                          onChange={(e) =>
                            onUpdateRenderBlock(section.id, index, {
                              ...block,
                              instruction: e.target.value,
                            })
                          }
                          placeholder="Instruction (e.g., Choose the correct option...)"
                          rows={3}
                          className="w-full p-3 border border-slate-200 rounded-lg text-gray-700 text-sm"
                        />
                      </div>

                      {block.type === "text" && (
                        <>
                          <textarea
                            value={toDisplayContent(block.content)}
                            onChange={(e) =>
                              onUpdateRenderBlock(section.id, index, {
                                ...block,
                                content: toStorageContent(e.target.value),
                              })
                            }
                            placeholder="Write the passage text or questions here..."
                            rows={5}
                            className="w-full p-3 border border-slate-200 rounded-lg text-gray-700 text-sm"
                          />
                        </>
                      )}

                      {block.type === "image" && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
                          <div className="border border-dashed border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-sm overflow-hidden">
                            {block.content ? (
                              <img
                                src={block.content}
                                alt={block.alt || ""}
                                className="w-full h-36 object-cover"
                              />
                            ) : (
                              <span>No image</span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                id={`image-upload-${section.id}-${index}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleImageFileChange(
                                    section.id,
                                    index,
                                    block,
                                    e.target.files?.[0],
                                  )
                                }
                              />
                              <label
                                htmlFor={`image-upload-${section.id}-${index}`}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm cursor-pointer"
                              >
                                Choose Image
                              </label>
                            </div>

                            <textarea
                              value={block.label || ""}
                              onChange={(e) =>
                                onUpdateRenderBlock(section.id, index, {
                                  ...block,
                                  label: e.target.value,
                                })
                              }
                              placeholder="Caption or related text..."
                              rows={3}
                              className="w-full p-3 border border-slate-200 rounded-lg text-gray-700 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => onAddRenderBlock(section.id)}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Block
                  </button>
                </div>
              </div>

              {/* Answer Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Answer Key
                </label>
                <button
                  onClick={() => onAddQuestion(section.id)}
                  className="w-full px-4 py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
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
