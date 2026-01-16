"use client";

import { useState, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import QuestionModal from "../../../../../components/dashboard/QuestionModal";
import ReadingModule from "../../../../../components/create/ReadingModule";
import WritingModule from "../../../../../components/create/WritingModule";
import ListeningModule from "../../../../../components/create/ListeningModule";

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
  heading?: string;
  questions: Question[];
  paragraphContent?: string;
  audioFile?: File | null;
}

interface WritingTask {
  id: number;
  heading: string;
  preHeading: string;
  subHeading: string;
  contentType: "text" | "image";
  textContent: string;
  imageFile: File | null;
}

function CreateModuleContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const type = searchParams.get("type") || "reading";
  const idCounterRef = useRef(2); // Start from 2 since initial section has id "1"

  // Generate unique ID without causing hydration errors
  const generateId = () => {
    const id = idCounterRef.current.toString();
    idCounterRef.current += 1;
    return id;
  };

  // State management
  const [sections, setSections] = useState<Section[]>([
    {
      id: "1",
      name: "SECTION 1",
      heading: "",
      questions: [],
      paragraphContent: "",
      audioFile: null,
    },
  ]);
  const [paragraphContent, setParagraphContent] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [writingTasks, setWritingTasks] = useState<WritingTask[]>([
    {
      id: 1,
      heading: "",
      preHeading: "",
      subHeading: "",
      contentType: "text",
      textContent: "",
      imageFile: null,
    },
    {
      id: 2,
      heading: "",
      preHeading: "",
      subHeading: "",
      contentType: "text",
      textContent: "",
      imageFile: null,
    },
  ]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"]);
  const [paperTitle, setPaperTitle] = useState("Untitled Module");

  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      name: `SECTION ${sections.length + 1}`,
      heading: "",
      questions: [],
      paragraphContent: "",
      audioFile: null,
    };
    setSections([...sections, newSection]);
    setExpandedSections([...expandedSections, newSection.id]);
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, name: newTitle } : section
      )
    );
  };

  const updateSectionHeading = (sectionId: string, heading: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, heading } : section
      )
    );
  };

  const updateSectionParagraph = (sectionId: string, content: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, paragraphContent: content }
          : section
      )
    );
  };

  const updateSectionAudio = (sectionId: string, file: File | null) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, audioFile: file } : section
      )
    );
  };

  const addQuestion = (sectionId: string) => {
    setCurrentSectionId(sectionId);
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

    const newQuestion: Question = {
      id: generateId(),
      text: questionData.text,
      type: questionData.type,
      blankPosition: questionData.blankPosition,
      mcqVariant: questionData.mcqVariant,
      options: questionData.options,
      correctAnswers: questionData.correctAnswers,
      answer: questionData.answer,
      explanation: questionData.explanation,
    };

    setSections(
      sections.map((section) =>
        section.id === currentSectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    );

    setShowQuestionModal(false);
    setCurrentSectionId(null);
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter((q) => q.id !== questionId),
            }
          : section
      )
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const updateWritingTask = (
    taskId: number,
    field: keyof WritingTask,
    value: any
  ) => {
    setWritingTasks(
      writingTasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  const renderModuleTabs = () => (
    <div className="flex items-center gap-6 mb-4 border-b border-slate-200">
      <a
        href={`/dashboard/${slug}/create/modules?type=reading`}
        className={`pb-2 px-2 text-sm font-medium transition-colors ${
          type === "reading"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        READING
      </a>
      <a
        href={`/dashboard/${slug}/create/modules?type=writing`}
        className={`pb-2 px-2 text-sm font-medium transition-colors ${
          type === "writing"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        WRITING
      </a>
      <a
        href={`/dashboard/${slug}/create/modules?type=listening`}
        className={`pb-2 px-2 text-sm font-medium transition-colors ${
          type === "listening"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        LISTENING
      </a>
      <a
        href={`/dashboard/${slug}/create/modules?type=speaking`}
        className={`pb-2 px-2 text-sm font-medium transition-colors ${
          type === "speaking"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        SPEAKING
      </a>
    </div>
  );

  const renderModule = () => {
    switch (type) {
      case "reading":
        return (
          <ReadingModule
            sections={sections}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onAddSection={addSection}
            onAddQuestion={addQuestion}
            onDeleteQuestion={deleteQuestion}
            onUpdateSectionTitle={updateSectionTitle}
            onUpdateSectionHeading={updateSectionHeading}
            onUpdateSectionParagraph={updateSectionParagraph}
          />
        );
      case "writing":
        return (
          <WritingModule
            tasks={writingTasks}
            onUpdateTask={updateWritingTask}
          />
        );
      case "listening":
        return (
          <ListeningModule
            sections={sections}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onAddSection={addSection}
            onAddQuestion={addQuestion}
            onDeleteQuestion={deleteQuestion}
            onUpdateSectionTitle={updateSectionTitle}
            onUpdateSectionAudio={updateSectionAudio}
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
        <div className="mb-4">
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            className="text-lg px-2 py-1 font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg w-full placeholder:text-slate-400"
            placeholder="Enter module title..."
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading...</div>
      }
    >
      <CreateModuleContent />
    </Suspense>
  );
}
