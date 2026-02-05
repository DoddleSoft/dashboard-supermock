import { Plus, Trash2, ChevronDown, ChevronUp, X, Save } from "lucide-react";
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
  onAddQuestion: (sectionId: string, blockIndex: number) => void;
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
  onAddQuestion,
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

  // Modal State
  const [editingQuestion, setEditingQuestion] = useState<{
    sectionId: string;
    ref: string;
    data: any;
  } | null>(null);

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

  const handleEditClick = (
    sectionId: string,
    ref: string,
    questionData: any,
  ) => {
    setEditingQuestion({
      sectionId,
      ref,
      data: JSON.parse(JSON.stringify(questionData)),
    });
  };

  const handleModalSave = () => {
    if (editingQuestion) {
      onUpdateQuestion(
        editingQuestion.sectionId,
        editingQuestion.ref,
        editingQuestion.data,
      );
      setEditingQuestion(null);
    }
  };

  return (
    <div className="space-y-4 pb-4 relative">
      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Question {editingQuestion.ref}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={editingQuestion.data?.answer || ""}
                  onChange={(e) =>
                    setEditingQuestion((prev) =>
                      prev
                        ? {
                            ...prev,
                            data: { ...prev.data, answer: e.target.value },
                          }
                        : null,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  placeholder="Enter expected answer..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Question Type
                </label>
                <select
                  value={editingQuestion.data?.type || "mcq"}
                  onChange={(e) =>
                    setEditingQuestion((prev) =>
                      prev
                        ? {
                            ...prev,
                            data: { ...prev.data, type: e.target.value },
                          }
                        : null,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="blanks">Fill in Blanks</option>
                  <option value="true-false">True / False</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Points
                </label>
                <input
                  type="number"
                  value={editingQuestion.data?.points || 1}
                  onChange={(e) =>
                    setEditingQuestion((prev) =>
                      prev
                        ? {
                            ...prev,
                            data: {
                              ...prev.data,
                              points: Number(e.target.value),
                            },
                          }
                        : null,
                    )
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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

                      {/* --- ANSWER KEY ROW (Visible for this specific block only) --- */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Answer Key
                          </label>

                          {/* Show questions for THIS block */}
                          {(() => {
                            // Get questions referenced in this block's content via placeholders
                            const blockQuestionRefs = extractQuestionRefs(
                              block.content,
                            );

                            // Get questions created in THIS specific block
                            const questionsCreatedHere = Object.keys(
                              section.questions || {},
                            ).filter((ref) => {
                              const q = section.questions[ref];
                              return q?.createdInBlockIndex === index;
                            });

                            // Combine: questions referenced here OR created here
                            const questionsToShow = [
                              ...new Set([
                                ...blockQuestionRefs,
                                ...questionsCreatedHere,
                              ]),
                            ];

                            const finalQuestions = questionsToShow
                              .filter((ref) => section.questions[ref])
                              .sort((a, b) => Number(a) - Number(b));

                            return (
                              <>
                                {finalQuestions.map((ref) => {
                                  const data = section.questions[ref];

                                  return (
                                    <div key={ref} className="relative group">
                                      {/* Card Body */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEditClick(section.id, ref, data)
                                        }
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm transition-all border bg-white border-slate-200 text-slate-700 hover:border-green-400 hover:text-green-600"
                                      >
                                        {ref}
                                      </button>

                                      {/* Delete X Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteQuestion(section.id, ref);
                                        }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-100 border border-red-200 text-red-600 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-red-500 hover:text-white transition-colors"
                                        title={`Remove Question ${ref}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}

                                {/* Generic Add Button */}
                                <button
                                  onClick={() =>
                                    onAddQuestion(section.id, index)
                                  }
                                  className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                  title="Add Another Answer"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </>
                            );
                          })()}
                        </div>
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
