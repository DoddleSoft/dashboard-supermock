"use client";

import React from "react";

export type ThemeColor = "green" | "blue" | "purple";

export interface RenderBlockProps {
  block: {
    type: string;
    content?: string;
    alt?: string;
    label?: string;
    placeholder?: string;
    min_words?: number;
  };
  theme?: ThemeColor;
  showQuestionNumbers?: boolean;
  questions?: Record<string, { answer: string; options?: any[] }>;
  answers?: Record<string, string>;
  onAnswerChange?: (qNum: string, value: string) => void;
}

const themeColors = {
  green: {
    instruction: "bg-blue-50 text-blue-900",
    box: "border-gray-200 bg-gray-50",
    boxBorder: "",
    focus: "focus:border-green-600 focus:ring-green-600",
    radio: "text-green-600 focus:ring-green-500",
  },
  blue: {
    instruction: "bg-blue-50 text-blue-900",
    box: "border-gray-200 bg-gray-50",
    boxBorder: "",
    focus: "focus:border-blue-600 focus:ring-blue-600",
    radio: "text-blue-600 focus:ring-blue-500",
  },
  purple: {
    instruction: "bg-purple-50 text-purple-900",
    box: "bg-gray-50",
    boxBorder: "border-l-4 border-purple-600",
    focus: "focus:border-purple-600 focus:ring-purple-600",
    radio: "text-purple-600 focus:ring-purple-500",
  },
};

export const RenderBlockView: React.FC<RenderBlockProps> = ({
  block,
  theme = "green",
  showQuestionNumbers = false,
  questions = {},
  answers = {},
  onAnswerChange,
}) => {
  const { type, content } = block;
  const colors = themeColors[theme];

  const renderContent = (text: string) => {
    if (!onAnswerChange) {
      return <>{text}</>;
    }
    const regex = /{{\s*(\d+)\s*}\s*(blanks|true-false|mcq)\s*}/g;

    const parts: React.ReactElement[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>,
        );
      }

      const qNum = match[1];
      const inputType = match[2];
      const qData = questions[qNum];

      if (inputType === "true-false") {
        const options = qData?.options ?? ["TRUE", "FALSE", "NOT GIVEN"];
        parts.push(
          <span
            key={`q-${qNum}`}
            className="inline-flex items-center gap-1 mx-1 align-middle"
          >
            {showQuestionNumbers && (
              <span className="text-xs font-bold text-gray-500 mr-1">
                {qNum}.
              </span>
            )}
            <select
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              className={`rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-1 ${colors.focus}`}
            >
              <option value="">Select...</option>
              {options.map((opt: any) => {
                const val = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={val} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
          </span>,
        );
      } else if (inputType === "mcq") {
        // ... (MCQ logic same as before, shortened for brevity)
        const options = qData?.options || [];
        const hasOptions = options.length > 0;

        // Simplified dropdown render for preview
        parts.push(
          <span
            key={`q-${qNum}`}
            className="inline-flex items-center gap-1 mx-1 align-middle"
          >
            {showQuestionNumbers && (
              <span className="text-xs font-bold text-gray-500 mr-1">
                {qNum}.
              </span>
            )}
            <select
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              className={`rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-1 ${colors.focus}`}
            >
              <option value="">Select Option...</option>
              {hasOptions ? (
                options.map((opt: any) => {
                  const val = typeof opt === "string" ? opt : opt.label;
                  return (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  );
                })
              ) : (
                <option disabled>No options</option>
              )}
            </select>
          </span>,
        );
      } else if (inputType === "blanks") {
        // --- BLANKS RENDERING ---
        parts.push(
          <span key={`q-${qNum}`} className="inline-flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-600">{qNum}.</span>
            <input
              type="text"
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              placeholder="___"
              className={`inline-block w-32 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 ${colors.focus}`}
            />
          </span>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>,
      );
    }

    return parts.length > 0 ? parts : <>{text}</>;
  };

  switch (type) {
    case "text":
    case "html": // Fallback for html types to try parsing blanks too
      if (content && onAnswerChange) {
        return (
          <div className="mb-4 text-sm leading-8 text-gray-800 whitespace-pre-wrap">
            {renderContent(content)}
          </div>
        );
      }
      return (
        <div
          className="mb-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: content || "" }}
        />
      );

    case "instruction":
      return (
        <div
          className={`mb-4 rounded-lg p-3 text-xs italic font-medium ${colors.instruction}`}
        >
          {content}
        </div>
      );

    case "box":
      return (
        <div
          className={`my-4 rounded-lg border p-4 ${colors.box} ${theme === "purple" ? colors.boxBorder : ""}`}
        >
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 font-sans">
            {renderContent(content || "")}
          </pre>
        </div>
      );

    case "header":
      return (
        <h3 className="mt-6 mb-3 text-lg font-bold text-gray-900">{content}</h3>
      );

    case "image":
      return (
        <div className="my-6 flex justify-center">
          <img
            src={content}
            alt={block.alt}
            className="max-h-96 rounded-lg border shadow-sm object-contain"
          />
        </div>
      );

    default:
      return null;
  }
};
