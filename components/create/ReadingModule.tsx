import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  RenderBlock,
  RenderBlockType,
  ReadingSection,
  QuestionDefinition,
} from "../../context/ModuleContext";

interface ReadingModuleProps {
  sections: ReadingSection[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddQuestion: (sectionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onUpdateSectionHeading: (sectionId: string, heading: string) => void;
  onUpdateSectionInstruction: (sectionId: string, instruction: string) => void;
  onUpdateSectionPassage: (sectionId: string, content: string) => void;
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

export default function ReadingModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onAddQuestion,
  onUpdateSectionTitle,
  onUpdateSectionHeading,
  onUpdateSectionInstruction,
  onUpdateSectionPassage,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
  onUpdateQuestionKey,
  onDeleteQuestionKey,
}: ReadingModuleProps) {
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

  return (
    <div className="space-y-4 pb-4">
      {sections.map((section) => (
        <div
          key={section.id}
          className="border border-slate-200 rounded-xl overflow-hidden"
        >
          {/* Section Header */}
          <div className="p-6" onClick={() => onToggleSection(section.id)}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Section
            </label>
            <div className="flex items-center cursor-pointer">
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateSectionTitle(section.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Enter the title for this section..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
              {expandedSections.includes(section.id) ? (
                <ChevronUp className="w-5 h-5 text-slate-400 mx-4" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 mx-4" />
              )}
            </div>
          </div>

          {expandedSections.includes(section.id) && (
            <div className="px-6 pb-4">
              {/* Heading */}
              <div className="mb-6">
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
              <div className="mb-6">
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
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Passage
                </label>
                <textarea
                  value={section.passageText || ""}
                  onChange={(e) =>
                    onUpdateSectionPassage(section.id, e.target.value)
                  }
                  placeholder="Enter the reading passage for this section..."
                  className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none text-sm"
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
