import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  WritingSection,
} from "../../context/ModuleContext";
import { compressImage } from "../../lib/mediaCompression";

interface WritingModuleProps {
  sections: WritingSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSectionHeading: (sectionId: string, heading: string) => void;
  onUpdateSectionSubheading: (sectionId: string, subheading: string) => void;
  onUpdateSectionInstruction: (sectionId: string, instruction: string) => void;
  onUpdateSectionTime: (sectionId: string, timeMinutes: number) => void;
  onUpdateSectionMinWords: (sectionId: string, minWords: number) => void;
  onAddRenderBlock: (sectionId: string) => void;
  onUpdateRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => void;
  onDeleteRenderBlock: (sectionId: string, blockIndex: number) => void;
}

export default function WritingModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onDeleteSection,
  onUpdateSectionHeading,
  onUpdateSectionSubheading,
  onUpdateSectionInstruction,
  onUpdateSectionTime,
  onUpdateSectionMinWords,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
}: WritingModuleProps) {
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
    const placeholder = `{{${draft.number}}${draft.type}}`;
    const separator = block.content && !block.content.endsWith(" ") ? " " : "";
    onUpdateRenderBlock(sectionId, index, {
      ...block,
      content: `${block.content}${separator}${placeholder}`,
    });
    setPlaceholderDrafts((prev) => {
      const newState = { ...prev };
      delete newState[getDraftKey(sectionId, index)];
      return newState;
    });
  };

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
                value={section.heading}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateSectionHeading(section.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter the heading for this task..."
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
              {/* Subheading */}
              <div className="my-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Subheading
                </label>
                <input
                  type="text"
                  value={section.subheading || ""}
                  onChange={(e) =>
                    onUpdateSectionSubheading(section.id, e.target.value)
                  }
                  placeholder="Enter Subheading..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* Time and Min Words */}
              <div className="my-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={section.timeMinutes || ""}
                    onChange={(e) =>
                      onUpdateSectionTime(
                        section.id,
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="e.g., 20"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    Minimum Words
                  </label>
                  <input
                    type="number"
                    value={section.minWords || ""}
                    onChange={(e) =>
                      onUpdateSectionMinWords(
                        section.id,
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="e.g., 150"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
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
                        <button
                          onClick={() => onDeleteRenderBlock(section.id, index)}
                          className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {block.type === "text" && (
                        <>
                          <textarea
                            value={block.content}
                            onChange={(e) =>
                              onUpdateRenderBlock(section.id, index, {
                                ...block,
                                content: e.target.value,
                              })
                            }
                            placeholder="Write the passage text or task here..."
                            rows={5}
                            className="w-full p-3 border border-slate-200 rounded-lg text-gray-700 text-sm"
                          />
                        </>
                      )}

                      {block.type === "image" && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
                          <div className="border border-dashed border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-sm overflow-hidden relative">
                            {compressingImages.has(
                              `${section.id}-${index}`,
                            ) && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <div className="text-blue-600 text-xs">
                                  Compressing...
                                </div>
                              </div>
                            )}
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
