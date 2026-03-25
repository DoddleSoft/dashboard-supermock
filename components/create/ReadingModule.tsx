import { Plus, Trash2, ChevronDown, ChevronUp, Notebook } from "lucide-react";
import {
  RenderBlock,
  RenderBlockType,
  ReadingSection,
} from "../../context/ModuleContext";
import { compressImage } from "../../lib/mediaCompression";
import AnswerKeyTable from "./AnswerKeyTable";
import InstructionTemplates from "./InstructionTemplates";

interface ReadingModuleProps {
  sections: ReadingSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteQuestion: (sectionId: string, questionRef: string) => void;
  onUpdateQuestion: (sectionId: string, questionRef: string, data: any) => void;
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

const placeholders = ["{{X}mcq}", "{{X}blanks}", "{{X}true-false}"];

export default function ReadingModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onDeleteSection,
  onDeleteQuestion,
  onUpdateQuestion,
  onUpdateSectionTitle,
  onUpdateSectionHeading,
  onUpdateSectionInstruction,
  onUpdateSectionPassage,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
}: ReadingModuleProps) {
  const blockTypes: RenderBlockType[] = ["text", "image"];

  const toDisplayContent = (value: string) =>
    value.replace(/\{\{(\d+)\}(blanks|dropdown|boolean)\}\}/g, "⟦Q$1:$2⟧");

  const handleImageFileChange = async (
    sectionId: string,
    index: number,
    block: RenderBlock,
    file?: File | null,
  ) => {
    if (!file) return;

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
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Failed to process image:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  // Calculate all questions across all sections for consistent numbering
  const allQuestions = sections.reduce(
    (acc, section) => {
      return { ...acc, ...section.questions };
    },
    {} as Record<string, any>,
  );

  return (
    <div className="space-y-4 pb-4 relative">
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
                <label className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Instruction
                  <InstructionTemplates />
                </label>
                <textarea
                  value={section.instruction || ""}
                  onChange={(e) =>
                    onUpdateSectionInstruction(section.id, e.target.value)
                  }
                  placeholder="Enter the instruction for this passage..."
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
                      <div className="flex items-center gap-4 mb-4">
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
                                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-mono text-slate-900 hover:bg-slate-100 hover:border-slate-400 active:scale-95 transition"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex item-center justify-between">
                          <InstructionTemplates />
                          <button
                            onClick={() =>
                              onDeleteRenderBlock(section.id, index)
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5 text-red-700" />
                          </button>
                        </div>
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

                      {/* Answer Key Table */}
                      <AnswerKeyTable
                        sectionId={section.id}
                        blockIndex={index}
                        blockContent={block.content}
                        questions={section.questions}
                        allQuestions={allQuestions}
                        onUpdateQuestion={onUpdateQuestion}
                        onDeleteQuestion={onDeleteQuestion}
                        accentColor="red"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => onAddRenderBlock(section.id)}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 text-red-600 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
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
