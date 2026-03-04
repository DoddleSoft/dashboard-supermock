"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { QuestionDefinition } from "../../context/ModuleContext";

const QUESTION_TYPES = [
  { value: "mcq", label: "MCQ" },
  { value: "blanks", label: "Blanks" },
  { value: "true-false", label: "True / False" },
] as const;

function extractQuestionRefs(content: string): string[] {
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
}

interface AnswerKeyTableProps {
  sectionId: string;
  blockIndex: number;
  blockContent: string;
  questions: Record<string, QuestionDefinition>;
  allQuestions: Record<string, QuestionDefinition>; // All questions from all sections
  onUpdateQuestion: (sectionId: string, ref: string, data: any) => void;
  onDeleteQuestion: (sectionId: string, ref: string) => void;
  accentColor?: "red" | "red";
}

export default function AnswerKeyTable({
  sectionId,
  blockIndex,
  blockContent,
  questions,
  allQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
  accentColor = "red",
}: AnswerKeyTableProps) {
  const [addCount, setAddCount] = useState(1);

  // Track raw options text per question ref to prevent cursor jumping
  const [rawOptions, setRawOptions] = useState<Record<string, string>>({});

  // Determine which questions belong to this block
  const blockQuestionRefs = extractQuestionRefs(blockContent);
  const questionsCreatedHere = Object.keys(questions).filter(
    (ref) => questions[ref]?.createdInBlockIndex === blockIndex,
  );
  const questionsToShow = [
    ...new Set([...blockQuestionRefs, ...questionsCreatedHere]),
  ]
    .filter((ref) => questions[ref])
    .sort((a, b) => Number(a) - Number(b));

  // Next available ref across ALL section questions in the entire module
  const getNextRef = (): number => {
    const allRefs = Object.keys(allQuestions)
      .map(Number)
      .filter((n) => !isNaN(n));
    return allRefs.length > 0 ? Math.max(...allRefs) + 1 : 1;
  };

  const handleAddQuestions = () => {
    const currentTotal = Object.keys(allQuestions).filter(
      (ref) => !isNaN(Number(ref)),
    ).length;

    if (currentTotal >= 40) {
      return; // Already at maximum
    }

    const maxToAdd = 40 - currentTotal;
    const count = Math.max(1, Math.min(maxToAdd, addCount));
    let nextRef = getNextRef();

    for (let i = 0; i < count; i++) {
      onUpdateQuestion(sectionId, String(nextRef), {
        answer: "",
        correctAnswers: [],
        options: [],
        explanation: "",
        type: "mcq",
        createdInBlockIndex: blockIndex,
      });
      nextRef++;
    }
  };

  const handleFieldChange = (ref: string, field: string, value: string) => {
    const existing = questions[ref];
    if (!existing) return;
    const updated = { ...existing };

    switch (field) {
      case "type":
        updated.type = value as QuestionDefinition["type"];
        if (value !== "mcq") {
          updated.options = [];
          setRawOptions((prev) => {
            const next = { ...prev };
            delete next[ref];
            return next;
          });
        }
        break;
      case "answer":
        updated.answer = value;
        updated.correctAnswers = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "options":
        setRawOptions((prev) => ({ ...prev, [ref]: value }));
        updated.options = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "explanation":
        updated.explanation = value;
        break;
    }

    onUpdateQuestion(sectionId, ref, updated);
  };

  const handleDeleteQuestion = (ref: string) => {
    setRawOptions((prev) => {
      const next = { ...prev };
      delete next[ref];
      return next;
    });
    onDeleteQuestion(sectionId, ref);
  };

  const getOptionsDisplay = (ref: string): string => {
    if (ref in rawOptions) return rawOptions[ref];
    return questions[ref]?.options?.join(", ") || "";
  };

  const accent =
    accentColor === "red"
      ? {
          addBtn: "bg-red-600 hover:bg-red-700",
          badge: "bg-red-50 text-red-700 border-red-200",
        }
      : {
          addBtn: "bg-green-600 hover:bg-green-700",
          badge: "bg-green-50 text-green-700 border-green-200",
        };

  const currentTotal = Object.keys(allQuestions).filter(
    (ref) => !isNaN(Number(ref)),
  ).length;
  const remaining = 40 - currentTotal;
  const isAtLimit = currentTotal >= 40;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      {/* Header with Add Questions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Answer Key
          </label>
          <span className="text-xs text-slate-500">
            ({currentTotal}/40 questions used)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={remaining}
            value={Math.min(addCount, remaining)}
            onChange={(e) =>
              setAddCount(
                Math.max(1, Math.min(remaining, Number(e.target.value) || 1)),
              )
            }
            disabled={isAtLimit}
            className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            onClick={handleAddQuestions}
            disabled={isAtLimit}
            className={`px-3 py-1.5 ${isAtLimit ? "bg-slate-400 cursor-not-allowed" : accent.addBtn} text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Excel-like table */}
      {questionsToShow.length > 0 ? (
        <div className="border text-gray-700 border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">
                  Q No
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                  Type
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Answers
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Options
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Explanation
                </th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questionsToShow.map((ref) => {
                const q = questions[ref];
                if (!q) return null;
                const isMcq =
                  q.type === "mcq" ||
                  q.type === "mcq-3" ||
                  q.type === "mcq-5" ||
                  !q.type;

                return (
                  <tr
                    key={ref}
                    className="group hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Q No */}
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold ${accent.badge}`}
                      >
                        {ref}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2">
                      <select
                        value={q.type || "mcq"}
                        onChange={(e) =>
                          handleFieldChange(ref, "type", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Answers */}
                    <td className="px-3 py-2">
                      {q.type === "true-false" ? (
                        <select
                          value={q.answer || ""}
                          onChange={(e) =>
                            handleFieldChange(ref, "answer", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
                        >
                          <option value="">Select answer</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                          <option value="not given">Not Given</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={q.answer || ""}
                          onChange={(e) =>
                            handleFieldChange(ref, "answer", e.target.value)
                          }
                          placeholder="A, B"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300"
                        />
                      )}
                    </td>

                    {/* Options */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={getOptionsDisplay(ref)}
                        onChange={(e) =>
                          handleFieldChange(ref, "options", e.target.value)
                        }
                        placeholder={isMcq ? "A, B, C, D" : "—"}
                        disabled={!isMcq}
                        className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300 ${
                          !isMcq
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </td>

                    {/* Explanation */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={q.explanation || ""}
                        onChange={(e) =>
                          handleFieldChange(ref, "explanation", e.target.value)
                        }
                        placeholder="Why is this correct?"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300"
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDeleteQuestion(ref)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title={`Delete Q${ref}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-6 text-sm text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          {isAtLimit
            ? "Maximum 40 questions reached"
            : "No questions yet — enter a count above and click Add."}
        </p>
      )}
    </div>
  );
}
