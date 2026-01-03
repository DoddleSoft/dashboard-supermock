import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

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
  paragraphContent?: string;
}

interface ReadingModuleProps {
  sections: Section[];
  expandedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onAddSection: () => void;
  onAddQuestion: (sectionId: string) => void;
  onDeleteQuestion: (sectionId: string, questionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onUpdateSectionParagraph: (sectionId: string, content: string) => void;
}

export default function ReadingModule({
  sections,
  expandedSections,
  onToggleSection,
  onAddSection,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateSectionTitle,
  onUpdateSectionParagraph,
}: ReadingModuleProps) {
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
            <div className="p-6">
              {/* Paragraph Content */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Passage
                </label>
                <textarea
                  value={section.paragraphContent || ""}
                  onChange={(e) =>
                    onUpdateSectionParagraph(section.id, e.target.value)
                  }
                  placeholder="Enter the reading passage for this section..."
                  className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none text-sm"
                />
              </div>

              {/* Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Questions (Recommended: 8-15 per section)
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
