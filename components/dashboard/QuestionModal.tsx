"use client";

import React from "react";
import { X } from "lucide-react";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: {
    text: string;
    type: "fill-blank" | "mcq" | "true-false-not-given" | "yes-no-not-given";
    blankPosition?: "first" | "middle" | "end";
    mcqVariant?: "3-options-1-correct" | "5-options-2-correct";
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
  const [questionText, setQuestionText] = React.useState("");
  const [questionType, setQuestionType] = React.useState<
    "fill-blank" | "mcq" | "true-false-not-given" | "yes-no-not-given"
  >("mcq");
  const [blankPosition, setBlankPosition] = React.useState<
    "first" | "middle" | "end"
  >("middle");
  const [mcqVariant, setMcqVariant] = React.useState<
    "3-options-1-correct" | "5-options-2-correct"
  >("3-options-1-correct");
  const [options, setOptions] = React.useState(["", "", ""]);
  const [correctAnswers, setCorrectAnswers] = React.useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = React.useState("");
  const [explanation, setExplanation] = React.useState("");

  const handleMcqVariantChange = (
    variant: "3-options-1-correct" | "5-options-2-correct"
  ) => {
    setMcqVariant(variant);
    setOptions(
      variant === "3-options-1-correct" ? ["", "", ""] : ["", "", "", "", ""]
    );
    setCorrectAnswers([]);
  };

  const toggleCorrectAnswer = (option: string) => {
    if (!option.trim()) return;

    const maxCorrect = mcqVariant === "3-options-1-correct" ? 1 : 2;

    if (correctAnswers.includes(option)) {
      setCorrectAnswers(correctAnswers.filter((ans) => ans !== option));
    } else {
      if (correctAnswers.length < maxCorrect) {
        setCorrectAnswers([...correctAnswers, option]);
      } else if (maxCorrect === 1) {
        setCorrectAnswers([option]);
      }
    }
  };

  const handleSave = () => {
    if (!questionText || !explanation) return;

    const questionData: any = {
      text: questionText,
      type: questionType,
      explanation: explanation,
    };

    if (questionType === "fill-blank") {
      questionData.blankPosition = blankPosition;
      questionData.answer = correctAnswer;
    } else if (questionType === "mcq") {
      questionData.mcqVariant = mcqVariant;
      questionData.options = options.filter((opt) => opt.trim());
      questionData.correctAnswers = correctAnswers;
      questionData.answer = correctAnswers.join(", ");
    } else {
      questionData.answer = correctAnswer;
    }

    onSave(questionData);

    // Reset form
    setQuestionText("");
    setQuestionType("mcq");
    setBlankPosition("middle");
    setMcqVariant("3-options-1-correct");
    setOptions(["", "", ""]);
    setCorrectAnswers([]);
    setCorrectAnswer("");
    setExplanation("");
  };

  const handleClose = () => {
    // Reset form on close
    setQuestionText("");
    setQuestionType("mcq");
    setBlankPosition("middle");
    setMcqVariant("3-options-1-correct");
    setOptions(["", "", ""]);
    setCorrectAnswers([]);
    setCorrectAnswer("");
    setExplanation("");
    onClose();
  };

  const isFormValid = () => {
    if (!questionText || !explanation) return false;

    if (questionType === "mcq") {
      return (
        correctAnswers.length > 0 &&
        options.filter((opt) => opt.trim()).length >=
          (mcqVariant === "3-options-1-correct" ? 3 : 5)
      );
    } else if (questionType === "fill-blank") {
      return !!correctAnswer;
    } else {
      return !!correctAnswer;
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
                    | "true-false-not-given"
                    | "yes-no-not-given"
                )
              }
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
            >
              <option value="mcq">Multiple Choice Question (MCQ)</option>
              <option value="fill-blank">Fill in the Blanks</option>
              <option value="true-false-not-given">True/False/Not Given</option>
              <option value="yes-no-not-given">Yes/No/Not Given</option>
            </select>
          </div>

          {/* Fill in the Blanks */}
          {questionType === "fill-blank" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Blank Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["first", "middle", "end"] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setBlankPosition(pos)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        blankPosition === pos
                          ? "bg-red-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:border-red-300"
                      }`}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sentence (use _____ for blank)
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Example: The _____ is the capital of France."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter the word(s) that fill the blank..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </>
          )}

          {/* MCQ */}
          {questionType === "mcq" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MCQ Variant
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleMcqVariantChange("3-options-1-correct")
                    }
                    className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                      mcqVariant === "3-options-1-correct"
                        ? "bg-red-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:border-red-300"
                    }`}
                  >
                    3 Options, 1 Correct
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleMcqVariantChange("5-options-2-correct")
                    }
                    className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                      mcqVariant === "5-options-2-correct"
                        ? "bg-red-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:border-red-300"
                    }`}
                  >
                    5 Options, 2 Correct
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Options (Select{" "}
                  {mcqVariant === "3-options-1-correct" ? "1" : "2"} correct
                  answer{mcqVariant === "5-options-2-correct" ? "s" : ""})
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={correctAnswers.includes(option)}
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

                          // Update correctAnswers if this option was selected
                          if (correctAnswers.includes(oldValue)) {
                            setCorrectAnswers(
                              correctAnswers.map((ans) =>
                                ans === oldValue ? e.target.value : ans
                              )
                            );
                          }
                        }}
                        placeholder={`Option ${String.fromCharCode(
                          65 + index
                        )}`}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Check the box next to the correct answer
                  {mcqVariant === "5-options-2-correct" ? "s" : ""}
                </p>
              </div>
            </>
          )}

          {/* True/False/Not Given */}
          {questionType === "true-false-not-given" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statement
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the statement to evaluate..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correct Answer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["True", "False", "Not Given"].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setCorrectAnswer(ans)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        correctAnswer === ans
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

          {/* Yes/No/Not Given */}
          {questionType === "yes-no-not-given" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statement
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the statement to evaluate..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correct Answer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Yes", "No", "Not Given"].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => setCorrectAnswer(ans)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        correctAnswer === ans
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
