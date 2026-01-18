"use client";

import { useMemo, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import QuestionModal from "../../../../../components/dashboard/QuestionModal";
import ReadingModule from "../../../../../components/create/ReadingModule";
import WritingModule from "../../../../../components/create/WritingModule";
import ListeningModule from "../../../../../components/create/ListeningModule";
import {
  ModuleProvider,
  useModuleContext,
  QuestionDefinition,
  RenderBlock,
} from "../../../../../context/ModuleContext";

function CreateModuleContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const type = searchParams.get("type") || "reading";
  const typeKey = ["reading", "writing", "listening", "speaking"].includes(type)
    ? (type as "reading" | "writing" | "listening" | "speaking")
    : "reading";

  // Get context methods and data
  const {
    moduleTitles,
    setModuleTitle,
    readingSections,
    readingExpandedSections,
    addReadingSection,
    updateReadingSectionTitle,
    updateReadingSectionHeading,
    updateReadingSectionInstruction,
    updateReadingSectionPassageText,
    addReadingRenderBlock,
    updateReadingRenderBlock,
    deleteReadingRenderBlock,
    updateReadingQuestion,
    toggleReadingSection,
    listeningSections,
    listeningExpandedSections,
    addListeningSection,
    updateListeningSectionTitle,
    updateListeningSectionInstruction,
    updateListeningSectionAudioPath,
    updateListeningSectionAudio,
    addListeningRenderBlock,
    updateListeningRenderBlock,
    deleteListeningRenderBlock,
    updateListeningQuestion,
    toggleListeningSection,
    writingTasks,
    updateWritingTaskField,
    addWritingRenderBlock,
    updateWritingRenderBlock,
    deleteWritingRenderBlock,
  } = useModuleContext();

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentModuleType, setCurrentModuleType] = useState<
    "reading" | "listening"
  >("reading");

  const sectionById = useMemo(
    () => ({
      reading: (id: string) => readingSections.find((s) => s.id === id),
      listening: (id: string) => listeningSections.find((s) => s.id === id),
    }),
    [readingSections, listeningSections],
  );

  const getNextQuestionRef = (
    questions: Record<string, QuestionDefinition>,
  ) => {
    const numbers = Object.keys(questions)
      .map((key) => Number(key))
      .filter((num) => !Number.isNaN(num));
    const max = numbers.length ? Math.max(...numbers) : 0;
    return String(max + 1);
  };

  const questionTypeToPlaceholder = (
    questionType:
      | "fill-blank"
      | "mcq"
      | "true-false-not-given"
      | "yes-no-not-given",
  ) => {
    switch (questionType) {
      case "fill-blank":
        return "blanks";
      case "mcq":
        return "dropdown";
      case "true-false-not-given":
      case "yes-no-not-given":
        return "boolean";
      default:
        return "blanks";
    }
  };

  const addQuestion = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setCurrentModuleType(type === "listening" ? "listening" : "reading");
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (questionData: {
    text: string;
    type: "fill-blank" | "mcq" | "true-false-not-given" | "yes-no-not-given";
    blankPosition?: "first" | "middle" | "end";
    mcqVariant?: "3-options-1-correct" | "5-options-2-correct";
    options?: string[];
    correctAnswers?: string[];
    answer: string;
    explanation: string;
  }) => {
    if (!currentSectionId) return;

    const targetSection = sectionById[currentModuleType](currentSectionId);
    if (!targetSection) return;

    const questionRef = getNextQuestionRef(targetSection.questions);
    const placeholderType = questionTypeToPlaceholder(questionData.type);

    const renderBlock: RenderBlock = {
      type: "text",
      content: `${questionRef}. {{${questionRef}}${placeholderType}} ${questionData.text}`,
    };

    const optionsFromType =
      questionData.type === "true-false-not-given"
        ? ["TRUE", "FALSE", "NOT GIVEN"]
        : questionData.type === "yes-no-not-given"
          ? ["YES", "NO", "NOT GIVEN"]
          : questionData.options;

    const questionDefinition: QuestionDefinition = {
      answer: questionData.answer,
      options: optionsFromType?.filter((opt) => opt && opt.trim()),
      explanation: questionData.explanation,
    };

    if (currentModuleType === "reading") {
      addReadingRenderBlock(currentSectionId, renderBlock);
      updateReadingQuestion(currentSectionId, questionRef, questionDefinition);
    } else {
      addListeningRenderBlock(currentSectionId, renderBlock);
      updateListeningQuestion(
        currentSectionId,
        questionRef,
        questionDefinition,
      );
    }

    setShowQuestionModal(false);
    setCurrentSectionId(null);
  };

  const handleTabChange = (moduleType: string) => {
    router.push(`/dashboard/${slug}/create/modules?type=${moduleType}`);
  };

  const renderModuleTabs = () => (
    <div className="flex items-center gap-6 mb-4 border-b border-slate-200">
      <button
        onClick={() => handleTabChange("reading")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "reading"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        READING
      </button>
      <button
        onClick={() => handleTabChange("writing")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "writing"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        WRITING
      </button>
      <button
        onClick={() => handleTabChange("listening")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "listening"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        LISTENING
      </button>
      <button
        onClick={() => handleTabChange("speaking")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "speaking"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        SPEAKING
      </button>
    </div>
  );

  const renderModule = () => {
    switch (type) {
      case "reading":
        return (
          <ReadingModule
            sections={readingSections}
            expandedSections={readingExpandedSections}
            onToggleSection={toggleReadingSection}
            onAddSection={addReadingSection}
            onAddQuestion={addQuestion}
            onUpdateSectionTitle={updateReadingSectionTitle}
            onUpdateSectionHeading={updateReadingSectionHeading}
            onUpdateSectionInstruction={updateReadingSectionInstruction}
            onUpdateSectionPassage={updateReadingSectionPassageText}
            onAddRenderBlock={(sectionId) =>
              addReadingRenderBlock(sectionId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateReadingRenderBlock}
            onDeleteRenderBlock={deleteReadingRenderBlock}
          />
        );
      case "writing":
        return (
          <WritingModule
            tasks={writingTasks}
            onUpdateTaskField={updateWritingTaskField}
            onAddRenderBlock={(taskId) =>
              addWritingRenderBlock(taskId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateWritingRenderBlock}
            onDeleteRenderBlock={deleteWritingRenderBlock}
          />
        );
      case "listening":
        return (
          <ListeningModule
            sections={listeningSections}
            expandedSections={listeningExpandedSections}
            onToggleSection={toggleListeningSection}
            onAddSection={addListeningSection}
            onAddQuestion={addQuestion}
            onUpdateSectionTitle={updateListeningSectionTitle}
            onUpdateSectionInstruction={updateListeningSectionInstruction}
            onUpdateSectionAudioPath={updateListeningSectionAudioPath}
            onUpdateSectionAudio={updateListeningSectionAudio}
            onAddRenderBlock={(sectionId) =>
              addListeningRenderBlock(sectionId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateListeningRenderBlock}
            onDeleteRenderBlock={deleteListeningRenderBlock}
          />
        );
      case "speaking":
        return (
          <div className="text-center py-12">
            <p className="text-slate-500">
              Speaking module creator coming soon...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Paper Title */}
        <div className="mb-6 flex bg-gray-200 pl-4 rounded-lg items-center gap-4">
          <div className="w-12 text-lg font-semibold text-slate-500 tracking-wide">
            Title:
          </div>
          <input
            type="text"
            value={moduleTitles[typeKey]}
            onChange={(e) => setModuleTitle(typeKey, e.target.value)}
            className="text-lg px-4 py-2 my-1 font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg w-full placeholder:text-slate-400"
            placeholder={`Enter title for the ${typeKey} module...`}
          />
        </div>

        {renderModuleTabs()}

        {renderModule()}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors">
            Preview
          </button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-colors">
            Create
          </button>
        </div>
      </div>

      {/* Question Creation Modal Component */}
      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false);
          setCurrentSectionId(null);
        }}
        onSave={handleSaveQuestion}
      />
    </>
  );
}

export default function CreateModulePage() {
  return (
    <ModuleProvider>
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500">Loading...</div>
        }
      >
        <CreateModuleContent />
      </Suspense>
    </ModuleProvider>
  );
}
