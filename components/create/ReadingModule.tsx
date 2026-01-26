import { Plus, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  ReadingSection,
} from "../../context/ModuleContext";
import { compressImage } from "../../lib/mediaCompression";

interface ReadingModuleProps {
  sections: ReadingSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onAddQuestion: (sectionId: string) => void;
  onDeleteQuestion: (sectionId: string, questionRef: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onUpdateSectionHeading: (sectionId: string, heading: string) => void;
  onUpdateSectionInstruction: (sectionId: string, instruction: string) => void;
  onUpdateSectionPassage: (sectionId: string, content: string) => void;
  onAddRenderBlock: (sectionId: string) => void;
  onUpdateRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => void;
  onDeleteRenderBlock: (sectionId: string, blockIndex: number) => void;
}

export default function ReadingModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onDeleteSection,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateSectionTitle,
  onUpdateSectionHeading,
  onUpdateSectionInstruction,
  onUpdateSectionPassage,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
}: ReadingModuleProps) {
  const [placeholderDrafts, setPlaceholderDrafts] = useState<
    Record<string, { number: string; type: "blanks" | "dropdown" | "boolean" }>
  >({});
  const [compressingImages, setCompressingImages] = useState<Set<string>>(
    new Set(),
  );

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

  return (
    <div className="space-y-4 pb-4">
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
                placeholder="Enter the title for this section..."
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
            <div className="px-6 pb-4">
              {/* Heading */}
              <div className="my-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Heading
                </label>
                <input
                  type="text"
                  value={section.heading || ""}
                  onChange={(e) =>
                    onUpdateSectionHeading(section.id, e.target.value)
                  }
                  placeholder="Enter the heading for this section..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* Instruction */}
              <div className="my-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Instruction
                </label>
                <textarea
                  value={section.instruction || ""}
                  onChange={(e) =>
                    onUpdateSectionInstruction(section.id, e.target.value)
                  }
                  placeholder="Enter the instructions for this passage..."
                  className="w-full h-24 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none text-sm"
                />
              </div>

              {/* Paragraph Content */}
              <div className="my-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Passage
                </label>
                <textarea
                  value={section.passageText || ""}
                  onChange={(e) =>
                    onUpdateSectionPassage(section.id, e.target.value)
                  }
                  rows={5}
                  placeholder="Enter the reading passage for this section..."
                  className="w-full p-4 h-48 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
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
                          For question placeholder use{" "}
                          {"{{X}mcq}, {{X}blanks}, or {{X}true-false}"} format
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
                                content: e.target.value,
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
                {Object.keys(section.questions).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.keys(section.questions)
                      .sort((a, b) => Number(a) - Number(b))
                      .map((ref) => (
                        <div
                          key={ref}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          <span>{ref}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteQuestion(section.id, ref)}
                            className="ml-1 p-0.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                            aria-label={`Remove question ${ref}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                <button
                  onClick={() => onAddQuestion(section.id)}
                  className="w-full px-4 py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Questions Answer
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
