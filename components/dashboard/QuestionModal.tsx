"use client";

import React from "react";
import { X } from "lucide-react";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: {
    questionRef: string;
    type: "fill-blank" | "mcq" | "true-false-not-given";
    blankPosition?: "first" | "middle" | "end";
    options?: string[];
    correctAnswers?: string[];
    answer: string;
    explanation: string;
  }) => void;
}

export default function QuestionModal({
  isOpen,
  onClose,
  onSave,
}: QuestionModalProps) {
  const [questionRef, setQuestionRef] = React.useState("");
  const [questionType, setQuestionType] = React.useState<
    "fill-blank" | "mcq" | "true-false-not-given"
  >("mcq");
  const [blankPosition, setBlankPosition] = React.useState<
    "first" | "middle" | "end"
  >("middle");
  const [options, setOptions] = React.useState(["", ""]);
  // For MCQ: array of correct answers; for others: single string
  const [mcqCorrectAnswers, setMcqCorrectAnswers] = React.useState<string[]>(
    [],
  );
  const [singleAnswer, setSingleAnswer] = React.useState("");
  const [explanation, setExplanation] = React.useState("");

  const toggleCorrectAnswer = (option: string) => {
    if (!option.trim()) return;

    if (mcqCorrectAnswers.includes(option)) {
      setMcqCorrectAnswers(mcqCorrectAnswers.filter((ans) => ans !== option));
    } else {
      setMcqCorrectAnswers([...mcqCorrectAnswers, option]);
    }
  };

  const addOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed && mcqCorrectAnswers.includes(removed)) {
        setMcqCorrectAnswers((current) =>
          current.filter((ans) => ans !== removed),
        );
      }
      return next.length ? next : [""];
    });
  };

  const handleSave = () => {
    if (!questionRef || !explanation) return;

    const refNumber = Number(questionRef);
    if (Number.isNaN(refNumber) || refNumber < 1 || refNumber > 40) return;

    const questionData: any = {
      questionRef: String(refNumber),
      type: questionType,
      explanation: explanation,
    };

    if (questionType === "fill-blank") {
      questionData.blankPosition = blankPosition;
      questionData.answer = singleAnswer;
    } else if (questionType === "mcq") {
      questionData.options = options.filter((opt) => opt.trim());
      questionData.correctAnswers = mcqCorrectAnswers;
      questionData.answer = mcqCorrectAnswers.join(", ");
    } else {
      questionData.answer = singleAnswer;
    }

    onSave(questionData);

    // Reset form
    setQuestionRef("");
    setQuestionType("mcq");
    setBlankPosition("middle");
    setOptions(["", ""]);
    setMcqCorrectAnswers([]);
    setSingleAnswer("");
    setExplanation("");
  };

  const handleClose = () => {
    // Reset form on close
    setQuestionRef("");
    setQuestionType("mcq");
    setBlankPosition("middle");
    setOptions(["", ""]);
    setMcqCorrectAnswers([]);
    setSingleAnswer("");
    setExplanation("");
    onClose();
  };

  const isFormValid = () => {
    if (!questionRef || !explanation) return false;

    const refNumber = Number(questionRef);
    if (Number.isNaN(refNumber) || refNumber < 1 || refNumber > 40)
      return false;

    if (questionType === "mcq") {
      return (
        mcqCorrectAnswers.length > 0 &&
        options.filter((opt) => opt.trim()).length >= 2
      );
    } else if (questionType === "fill-blank") {
      return !!singleAnswer;
    } else {
      return !!singleAnswer;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-900">Create Question</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) =>
                setQuestionType(
                  e.target.value as
                    | "fill-blank"
                    | "mcq"
                    | "true-false-not-given",
                )
              }
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
            >
              <option value="mcq">Multiple Choice Question (MCQ)</option>
              <option value="fill-blank">Fill in the Blanks</option>
              <option value="true-false-not-given">True/False/Not Given</option>
            </select>
          </div>

          {/* Fill in the Blanks */}
          {questionType === "fill-blank" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correct Answer
              </label>
              <input
                type="text"
                value={singleAnswer}
                onChange={(e) => setSingleAnswer(e.target.value)}
                placeholder="Enter the word(s) that fill the blank..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* MCQ */}
          {questionType === "mcq" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Options (select all correct answers)
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mcqCorrectAnswers.includes(option)}
                        onChange={() => toggleCorrectAnswer(option)}
                        disabled={!option.trim()}
                        className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          const oldValue = newOptions[index];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);

                          if (mcqCorrectAnswers.includes(oldValue)) {
                            setMcqCorrectAnswers(
                              mcqCorrectAnswers.map((ans) =>
                                ans === oldValue ? e.target.value : ans,
                              ),
                            );
                          }
                        }}
                        placeholder={`Option ${String.fromCharCode(
                          65 + index,
                        )}`}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-slate-500 hover:text-red-600"
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 text-sm font-medium"
                >
                  Add Option
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Add as many options as you need and check all correct answers.
                </p>
              </div>
            </>
          )}

          {/* True/False/Not Given */}
          {questionType === "true-false-not-given" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correct Answer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["True", "False", "Not Given"].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setSingleAnswer(ans)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        singleAnswer === ans
                          ? "bg-red-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:border-red-300"
                      }`}
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question No. (1-40)
            </label>
            <input
              type="number"
              min={1}
              max={40}
              value={questionRef}
              onChange={(e) => setQuestionRef(e.target.value)}
              placeholder="Enter question number (1-40)"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Explanation (Common for all types) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Explanation
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this answer is correct..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-colors"
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
