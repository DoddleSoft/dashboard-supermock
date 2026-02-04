import { Plus, Upload, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  ListeningSection,
} from "../../context/ModuleContext";
import { compressImage, compressAudio } from "../../lib/mediaCompression";

interface ListeningModuleProps {
  sections: ListeningSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onAddQuestion: (sectionId: string, blockIndex: number) => void;
  onDeleteQuestion: (sectionId: string, questionRef: string) => void;
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

const placeholders = ["{{X}mcq}", "{{X}blanks}", "{{X}true-false}"];

export default function ListeningModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onDeleteSection,
  onAddQuestion,
  onDeleteQuestion,
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

  const [compressingImages, setCompressingImages] = useState<Set<string>>(
    new Set(),
  );
  const [compressingAudio, setCompressingAudio] = useState<Set<string>>(
    new Set(),
  );

  const blockTypes: RenderBlockType[] = ["text", "image"];

  // Extract question refs from block content
  const extractQuestionRefs = (content: string): string[] => {
    const refs = new Set<string>();
    const patterns = [
      /\{\{(\d+)\}(?:mcq|blanks|dropdown|boolean)\}\}/g,
      /⟦Q(\d+):(mcq|blanks|dropdown|boolean)⟧/g,
    ];
    
    patterns.forEach((regex) => {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        refs.add(match[1]);
      }
    });
    
    return Array.from(refs).sort((a, b) => Number(a) - Number(b));
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const toDisplayContent = (value: string) =>
    value.replace(/\{\{(\d+)\}(blanks|dropdown|boolean)\}\}/g, "⟦Q$1:$2⟧");

  const toStorageContent = (value: string) =>
    value.replace(/⟦Q(\d+):(blanks|dropdown|boolean)⟧/g, "{{$1}$2}");

  const handleImageFileChange = async (
    sectionId: string,
    index: number,
    block: RenderBlock,
    file?: File | null,
  ) => {
    if (!file) return;

    const blockKey = `${sectionId}-${index}`;
    setCompressingImages((prev) => new Set(prev).add(blockKey));

    try {
      // Compress the image first
      const compressedFile = await compressImage(file);

      // Convert compressed file to data URL
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateRenderBlock(sectionId, index, {
          ...block,
          content: reader.result as string,
        });
        setCompressingImages((prev) => {
          const next = new Set(prev);
          next.delete(blockKey);
          return next;
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Failed to process image:", error);
      setCompressingImages((prev) => {
        const next = new Set(prev);
        next.delete(blockKey);
        return next;
      });
    }
  };

  const handleAudioChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressingAudio((prev) => new Set(prev).add(sectionId));
      try {
        // Compress the audio first
        const compressedFile = await compressAudio(file);
        onUpdateSectionAudio(sectionId, compressedFile);
      } catch (error) {
        console.error("Failed to process audio:", error);
        // Fallback to original file if compression fails
        onUpdateSectionAudio(sectionId, file);
      } finally {
        setCompressingAudio((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      }
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
          <div className="p-6 border-b border-slate-200">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Section
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateSectionTitle(section.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter the title for this task..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
              <button
                onClick={() => onToggleSection(section.id)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              <button
                onClick={() => onDeleteSection(section.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
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

                {compressingAudio.has(section.id) && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Compressing audio...</span>
                  </div>
                )}

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
                        <div className="flex items-center gap-2">
                          <span className="text-md font-semibold text-slate-700">
                            For question placeholder use:
                          </span>

                          <div className="flex flex-wrap gap-2">
                            {placeholders.map((item) => (
                              <button
                                key={item}
                                onClick={() => copyToClipboard(item)}
                                className="
              rounded-lg border border-slate-300 
              bg-slate-50 px-3 py-1.5 
              text-sm font-mono text-slate-900
              hover:bg-slate-100 hover:border-slate-400
              active:scale-95 transition
            "
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
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

                      {/* Answer Key for this Render Block */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                          Answer Key for this Block
                        </label>
                        {(() => {
                          const blockQuestionRefs = extractQuestionRefs(block.content);
                          const blockQuestions = blockQuestionRefs.filter(ref => section.questions[ref]);
                          
                          return (
                            <>
                              {blockQuestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {blockQuestions.map((ref) => (
                                    <div
                                      key={ref}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold"
                                    >
                                      <span>{ref}</span>
                                      <button
                                        type="button"
                                        onClick={() => onDeleteQuestion(section.id, ref)}
                                        className="ml-1 p-0.5 rounded-full text-blue-600 hover:text-blue-900 hover:bg-blue-200"
                                        aria-label={`Remove question ${ref}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => onAddQuestion(section.id, index)}
                                className="w-full px-4 py-2.5 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Answer for Block Questions
                              </button>
                            </>
                          );
                        })()}
                      </div>
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
