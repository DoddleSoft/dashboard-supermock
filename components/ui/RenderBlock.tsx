const RenderBlock = ({
  block,
  questions,
  answers,
  onAnswerChange,
}: {
  block: { type: string; content: string };
  questions: Record<string, { answer: string; options?: string[] }>;
  answers: Record<string, string>;
  onAnswerChange: (qNum: string, value: string) => void;
}) => {
  const { type, content } = block;

  // Parse placeholders like {{1}boolean}, {{8}blanks}, {{14}dropdown}, {{3}mcq}, {{5}true-false-not-given}, {{2}true-false}
  const renderContent = (text: string) => {
    const regex =
      /{{(\d+)}(boolean|blanks|dropdown|mcq|true-false-not-given|true-false|fill-blank)}/g;
    const parts: React.ReactElement[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>,
        );
      }

      const qNum = match[1];
      const inputType = match[2];
      const normalizedType =
        inputType === "mcq"
          ? "dropdown"
          : inputType === "true-false-not-given"
            ? "boolean"
            : inputType === "true-false"
              ? "boolean"
              : inputType === "fill-blank"
                ? "blanks"
                : inputType;
      const qData = questions[qNum];

      const resolvedOptions =
        qData?.options && qData.options.length > 0
          ? qData.options
          : normalizedType === "boolean"
            ? ["TRUE", "FALSE", "NOT GIVEN"]
            : [];

      if (normalizedType === "boolean") {
        // Render dropdown for TRUE/FALSE/NOT GIVEN
        parts.push(
          <span key={`q-${qNum}`} className="inline-flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-600">{qNum}.</span>
            <select
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              className="mx-1 inline-block min-w-[140px] rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              disabled={resolvedOptions.length === 0}
            >
              <option value="">
                {resolvedOptions.length === 0 ? "No options" : "Select..."}
              </option>
              {resolvedOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </span>,
        );
      } else if (normalizedType === "dropdown") {
        // Render dropdown for MCQ options (i, ii, iii, A, B, C, etc.)
        parts.push(
          <span key={`q-${qNum}`} className="inline-flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-600">{qNum}.</span>
            <select
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              className="mx-1 inline-block min-w-[100px] rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              disabled={resolvedOptions.length === 0}
            >
              <option value="">
                {resolvedOptions.length === 0 ? "No options" : "Select..."}
              </option>
              {resolvedOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </span>,
        );
      } else if (normalizedType === "blanks") {
        // Render text input for fill-in-the-blank with question number
        parts.push(
          <span key={`q-${qNum}`} className="inline-flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-600">{qNum}.</span>
            <input
              type="text"
              value={answers[qNum] || ""}
              onChange={(e) => onAnswerChange(qNum, e.target.value)}
              placeholder="___"
              className="inline-block w-32 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </span>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>,
      );
    }

    return parts;
  };

  switch (type) {
    case "header":
      return (
        <h3 className="mt-4 mb-3 text-base font-bold text-gray-900">
          {content}
        </h3>
      );
    case "instruction":
      return (
        <p className="mb-4 rounded-lg bg-blue-50 p-3 text-xs italic text-blue-900">
          {content}
        </p>
      );
    case "title":
      return (
        <h4 className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-gray-800">
          {content}
        </h4>
      );
    case "subtitle":
      return (
        <h5 className="mt-3 mb-2 text-xs font-semibold text-gray-700">
          {content}
        </h5>
      );
    case "box":
      return (
        <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
            {content}
          </pre>
        </div>
      );
    case "text":
      return (
        <div className="mb-2 text-xs leading-7 text-gray-800 whitespace-pre-wrap">
          {renderContent(content)}
        </div>
      );
    case "image":
      return (
        <div className="my-6 flex justify-center">
          <img
            src={block.content}
            alt={"Diagram"}
            className="max-h-96 w-auto rounded-lg border shadow-sm object-contain"
          />
        </div>
      );
    default:
      return null;
  }
};

export default RenderBlock;
