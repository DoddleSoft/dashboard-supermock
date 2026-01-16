"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
} from "react";

export type RenderBlockType =
  | "header"
  | "instruction"
  | "title"
  | "subtitle"
  | "text"
  | "image"
  | "box"
  | "editor";

export interface RenderBlock {
  type: RenderBlockType;
  content: string;
  alt?: string;
  label?: string;
  placeholder?: string;
  min_words?: number;
}

export interface QuestionDefinition {
  answer: string;
  options?: string[];
  explanation?: string;
}

export interface ReadingSection {
  id: string;
  title: string;
  heading?: string;
  instruction?: string;
  passageText?: string;
  renderBlocks: RenderBlock[];
  questions: Record<string, QuestionDefinition>;
}

export interface ListeningSection {
  id: string;
  title: string;
  instruction?: string;
  audioPath?: string;
  audioFile?: File | null;
  renderBlocks: RenderBlock[];
  questions: Record<string, QuestionDefinition>;
}

export interface WritingTask {
  id: number;
  title: string;
  durationRecommendation: number;
  wordCountMin: number;
  renderBlocks: RenderBlock[];
}

// Module Data interface
interface ModuleData {
  reading: {
    sections: ReadingSection[];
    expandedSections: string[];
  };
  listening: {
    sections: ListeningSection[];
    expandedSections: string[];
  };
  writing: {
    tasks: WritingTask[];
  };
  paperTitle: string;
}

// Context interface
interface ModuleContextType {
  moduleData: ModuleData;
  paperTitle: string;
  setPaperTitle: (title: string) => void;

  // Reading module methods
  readingSections: ReadingSection[];
  readingExpandedSections: string[];
  addReadingSection: () => void;
  updateReadingSectionTitle: (sectionId: string, title: string) => void;
  updateReadingSectionHeading: (sectionId: string, heading: string) => void;
  updateReadingSectionInstruction: (
    sectionId: string,
    instruction: string
  ) => void;
  updateReadingSectionPassageText: (sectionId: string, content: string) => void;
  addReadingRenderBlock: (sectionId: string, block: RenderBlock) => void;
  updateReadingRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock
  ) => void;
  deleteReadingRenderBlock: (sectionId: string, blockIndex: number) => void;
  updateReadingQuestion: (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition
  ) => void;
  deleteReadingQuestion: (sectionId: string, questionRef: string) => void;
  toggleReadingSection: (sectionId: string) => void;

  // Listening module methods
  listeningSections: ListeningSection[];
  listeningExpandedSections: string[];
  addListeningSection: () => void;
  updateListeningSectionTitle: (sectionId: string, title: string) => void;
  updateListeningSectionInstruction: (
    sectionId: string,
    instruction: string
  ) => void;
  updateListeningSectionAudioPath: (sectionId: string, path: string) => void;
  updateListeningSectionAudio: (sectionId: string, file: File | null) => void;
  addListeningRenderBlock: (sectionId: string, block: RenderBlock) => void;
  updateListeningRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock
  ) => void;
  deleteListeningRenderBlock: (sectionId: string, blockIndex: number) => void;
  updateListeningQuestion: (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition
  ) => void;
  deleteListeningQuestion: (sectionId: string, questionRef: string) => void;
  toggleListeningSection: (sectionId: string) => void;

  // Writing module methods
  writingTasks: WritingTask[];
  updateWritingTaskField: (
    taskId: number,
    field: keyof WritingTask,
    value: any
  ) => void;
  addWritingRenderBlock: (taskId: number, block: RenderBlock) => void;
  updateWritingRenderBlock: (
    taskId: number,
    blockIndex: number,
    block: RenderBlock
  ) => void;
  deleteWritingRenderBlock: (taskId: number, blockIndex: number) => void;

  // Utility
  generateId: () => string;
}

// Create context
const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Provider component
export function ModuleProvider({ children }: { children: ReactNode }) {
  const idCounterRef = useRef(2);

  const generateId = () => {
    const id = idCounterRef.current.toString();
    idCounterRef.current += 1;
    return id;
  };

  // Initialize module data with default values
  const [moduleData, setModuleData] = useState<ModuleData>({
    reading: {
      sections: [
        {
          id: "1",
          title: "Passage 1",
          heading: "",
          instruction: "",
          passageText: "",
          renderBlocks: [],
          questions: {},
        },
      ],
      expandedSections: ["1"],
    },
    listening: {
      sections: [
        {
          id: "1",
          title: "Section 1",
          instruction: "",
          audioPath: "",
          audioFile: null,
          renderBlocks: [],
          questions: {},
        },
      ],
      expandedSections: ["1"],
    },
    writing: {
      tasks: [
        {
          id: 1,
          title: "Writing Task 1",
          durationRecommendation: 20,
          wordCountMin: 150,
          renderBlocks: [],
        },
        {
          id: 2,
          title: "Writing Task 2",
          durationRecommendation: 40,
          wordCountMin: 250,
          renderBlocks: [],
        },
      ],
    },
    paperTitle: "",
  });

  // Paper Title
  const setPaperTitle = (title: string) => {
    setModuleData((prev) => ({ ...prev, paperTitle: title }));
  };

  // ========== READING MODULE METHODS ==========

  const addReadingSection = () => {
    const newSection: ReadingSection = {
      id: generateId(),
      title: `Passage ${moduleData.reading.sections.length + 1}`,
      heading: "",
      instruction: "",
      passageText: "",
      renderBlocks: [],
      questions: {},
    };

    setModuleData((prev) => ({
      ...prev,
      reading: {
        sections: [...prev.reading.sections, newSection],
        expandedSections: [...prev.reading.expandedSections, newSection.id],
      },
    }));
  };

  const updateReadingSectionTitle = (sectionId: string, title: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId ? { ...section, title } : section
        ),
      },
    }));
  };

  const updateReadingSectionHeading = (sectionId: string, heading: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId ? { ...section, heading } : section
        ),
      },
    }));
  };

  const updateReadingSectionInstruction = (
    sectionId: string,
    instruction: string
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId ? { ...section, instruction } : section
        ),
      },
    }));
  };

  const updateReadingSectionPassageText = (
    sectionId: string,
    content: string
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? { ...section, passageText: content }
            : section
        ),
      },
    }));
  };

  const addReadingRenderBlock = (sectionId: string, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? { ...section, renderBlocks: [...section.renderBlocks, block] }
            : section
        ),
      },
    }));
  };

  const updateReadingRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                renderBlocks: section.renderBlocks.map((b, idx) =>
                  idx === blockIndex ? block : b
                ),
              }
            : section
        ),
      },
    }));
  };

  const deleteReadingRenderBlock = (sectionId: string, blockIndex: number) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                renderBlocks: section.renderBlocks.filter(
                  (_, idx) => idx !== blockIndex
                ),
              }
            : section
        ),
      },
    }));
  };

  const updateReadingQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                questions: {
                  ...section.questions,
                  [questionRef]: data,
                },
              }
            : section
        ),
      },
    }));
  };

  const deleteReadingQuestion = (sectionId: string, questionRef: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const { [questionRef]: _, ...rest } = section.questions;
          return { ...section, questions: rest };
        }),
      },
    }));
  };

  const toggleReadingSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        expandedSections: prev.reading.expandedSections.includes(sectionId)
          ? prev.reading.expandedSections.filter((id) => id !== sectionId)
          : [...prev.reading.expandedSections, sectionId],
      },
    }));
  };

  // ========== LISTENING MODULE METHODS ==========

  const addListeningSection = () => {
    const newSection: ListeningSection = {
      id: generateId(),
      title: `Section ${moduleData.listening.sections.length + 1}`,
      instruction: "",
      audioPath: "",
      audioFile: null,
      renderBlocks: [],
      questions: {},
    };

    setModuleData((prev) => ({
      ...prev,
      listening: {
        sections: [...prev.listening.sections, newSection],
        expandedSections: [...prev.listening.expandedSections, newSection.id],
      },
    }));
  };

  const updateListeningSectionTitle = (sectionId: string, title: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, title } : section
        ),
      },
    }));
  };

  const updateListeningSectionInstruction = (
    sectionId: string,
    instruction: string
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, instruction } : section
        ),
      },
    }));
  };

  const updateListeningSectionAudioPath = (sectionId: string, path: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, audioPath: path } : section
        ),
      },
    }));
  };

  const updateListeningSectionAudio = (
    sectionId: string,
    file: File | null
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, audioFile: file } : section
        ),
      },
    }));
  };

  const addListeningRenderBlock = (sectionId: string, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId
            ? { ...section, renderBlocks: [...section.renderBlocks, block] }
            : section
        ),
      },
    }));
  };

  const updateListeningRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                renderBlocks: section.renderBlocks.map((b, idx) =>
                  idx === blockIndex ? block : b
                ),
              }
            : section
        ),
      },
    }));
  };

  const deleteListeningRenderBlock = (
    sectionId: string,
    blockIndex: number
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                renderBlocks: section.renderBlocks.filter(
                  (_, idx) => idx !== blockIndex
                ),
              }
            : section
        ),
      },
    }));
  };

  const updateListeningQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                questions: {
                  ...section.questions,
                  [questionRef]: data,
                },
              }
            : section
        ),
      },
    }));
  };

  const deleteListeningQuestion = (sectionId: string, questionRef: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const { [questionRef]: _, ...rest } = section.questions;
          return { ...section, questions: rest };
        }),
      },
    }));
  };

  const toggleListeningSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        expandedSections: prev.listening.expandedSections.includes(sectionId)
          ? prev.listening.expandedSections.filter((id) => id !== sectionId)
          : [...prev.listening.expandedSections, sectionId],
      },
    }));
  };

  // ========== WRITING MODULE METHODS ==========

  const updateWritingTaskField = (
    taskId: number,
    field: keyof WritingTask,
    value: any
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId ? { ...task, [field]: value } : task
        ),
      },
    }));
  };

  const addWritingRenderBlock = (taskId: number, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId
            ? { ...task, renderBlocks: [...task.renderBlocks, block] }
            : task
        ),
      },
    }));
  };

  const updateWritingRenderBlock = (
    taskId: number,
    blockIndex: number,
    block: RenderBlock
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                renderBlocks: task.renderBlocks.map((b, idx) =>
                  idx === blockIndex ? block : b
                ),
              }
            : task
        ),
      },
    }));
  };

  const deleteWritingRenderBlock = (taskId: number, blockIndex: number) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                renderBlocks: task.renderBlocks.filter(
                  (_, idx) => idx !== blockIndex
                ),
              }
            : task
        ),
      },
    }));
  };

  const value: ModuleContextType = {
    moduleData,
    paperTitle: moduleData.paperTitle,
    setPaperTitle,

    // Reading
    readingSections: moduleData.reading.sections,
    readingExpandedSections: moduleData.reading.expandedSections,
    addReadingSection,
    updateReadingSectionTitle,
    updateReadingSectionHeading,
    updateReadingSectionInstruction,
    updateReadingSectionPassageText,
    addReadingRenderBlock,
    updateReadingRenderBlock,
    deleteReadingRenderBlock,
    updateReadingQuestion,
    deleteReadingQuestion,
    toggleReadingSection,

    // Listening
    listeningSections: moduleData.listening.sections,
    listeningExpandedSections: moduleData.listening.expandedSections,
    addListeningSection,
    updateListeningSectionTitle,
    updateListeningSectionInstruction,
    updateListeningSectionAudioPath,
    updateListeningSectionAudio,
    addListeningRenderBlock,
    updateListeningRenderBlock,
    deleteListeningRenderBlock,
    updateListeningQuestion,
    deleteListeningQuestion,
    toggleListeningSection,

    // Writing
    writingTasks: moduleData.writing.tasks,
    updateWritingTaskField,
    addWritingRenderBlock,
    updateWritingRenderBlock,
    deleteWritingRenderBlock,

    // Utility
    generateId,
  };

  return (
    <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
  );
}

// Custom hook to use the context
export function useModuleContext() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error("useModuleContext must be used within a ModuleProvider");
  }
  return context;
}
