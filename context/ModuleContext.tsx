"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useCentre } from "./CentreContext";

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
  instruction?: string;
  questions?: string;
  placeholder?: string;
  min_words?: number;
}

export interface QuestionDefinition {
  type?: "blanks" | "mcq-3" | "mcq-5";
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

export interface PaperSummary {
  id: string;
  title: string;
  paperType: string | null;
  isActive: boolean;
  createdAt: string;
  modulesCount: number;
  moduleTypes: string[];
}

export interface ModuleOverviewStats {
  totalPapers: number;
  totalModules: number;
  publishedPapers: number;
  draftPapers: number;
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
  moduleTitles: {
    reading: string;
    writing: string;
    listening: string;
    speaking: string;
  };
}

// Context interface
interface ModuleContextType {
  moduleData: ModuleData;
  moduleTitles: ModuleData["moduleTitles"];
  setModuleTitle: (
    type: keyof ModuleData["moduleTitles"],
    title: string,
  ) => void;

  // Center module overview
  centerPapers: PaperSummary[];
  centerModuleStats: ModuleOverviewStats | null;
  centerModulesLoading: boolean;
  centerModulesError: string | null;
  refreshCenterModules: () => Promise<void>;

  // Reading module methods
  readingSections: ReadingSection[];
  readingExpandedSections: string[];
  addReadingSection: () => void;
  updateReadingSectionTitle: (sectionId: string, title: string) => void;
  updateReadingSectionHeading: (sectionId: string, heading: string) => void;
  updateReadingSectionInstruction: (
    sectionId: string,
    instruction: string,
  ) => void;
  updateReadingSectionPassageText: (sectionId: string, content: string) => void;
  addReadingRenderBlock: (sectionId: string, block: RenderBlock) => void;
  updateReadingRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => void;
  deleteReadingRenderBlock: (sectionId: string, blockIndex: number) => void;
  updateReadingQuestion: (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
  ) => void;
  updateReadingQuestionRef: (
    sectionId: string,
    fromRef: string,
    toRef: string,
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
    instruction: string,
  ) => void;
  updateListeningSectionAudioPath: (sectionId: string, path: string) => void;
  updateListeningSectionAudio: (sectionId: string, file: File | null) => void;
  addListeningRenderBlock: (sectionId: string, block: RenderBlock) => void;
  updateListeningRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => void;
  deleteListeningRenderBlock: (sectionId: string, blockIndex: number) => void;
  updateListeningQuestion: (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
  ) => void;
  updateListeningQuestionRef: (
    sectionId: string,
    fromRef: string,
    toRef: string,
  ) => void;
  deleteListeningQuestion: (sectionId: string, questionRef: string) => void;
  toggleListeningSection: (sectionId: string) => void;

  // Writing module methods
  writingTasks: WritingTask[];
  updateWritingTaskField: (
    taskId: number,
    field: keyof WritingTask,
    value: any,
  ) => void;
  addWritingRenderBlock: (taskId: number, block: RenderBlock) => void;
  updateWritingRenderBlock: (
    taskId: number,
    blockIndex: number,
    block: RenderBlock,
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
  const { currentCenter } = useCentre();
  const supabase = createClient();

  const [centerPapers, setCenterPapers] = useState<PaperSummary[]>([]);
  const [centerModuleStats, setCenterModuleStats] =
    useState<ModuleOverviewStats | null>(null);
  const [centerModulesLoading, setCenterModulesLoading] = useState(false);
  const [centerModulesError, setCenterModulesError] = useState<string | null>(
    null,
  );

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
    moduleTitles: {
      reading: "",
      writing: "",
      listening: "",
      speaking: "",
    },
  });

  // Module Titles
  const setModuleTitle = (
    type: keyof ModuleData["moduleTitles"],
    title: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      moduleTitles: {
        ...prev.moduleTitles,
        [type]: title,
      },
    }));
  };

  const fetchCenterModules = async (centerId: string) => {
    try {
      setCenterModulesLoading(true);
      setCenterModulesError(null);

      const { data: papers, error: papersError } = await supabase
        .from("papers")
        .select("id,title,paper_type,is_active,created_at")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (papersError) throw papersError;

      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id,paper_id,module_type")
        .eq("center_id", centerId);

      if (modulesError) throw modulesError;

      const moduleCountsByPaper: Record<string, number> = {};
      const moduleTypesByPaper: Record<string, Set<string>> = {};

      (modules || []).forEach((mod) => {
        if (!mod.paper_id) return;
        moduleCountsByPaper[mod.paper_id] =
          (moduleCountsByPaper[mod.paper_id] || 0) + 1;
        if (!moduleTypesByPaper[mod.paper_id]) {
          moduleTypesByPaper[mod.paper_id] = new Set();
        }
        if (mod.module_type) {
          moduleTypesByPaper[mod.paper_id].add(mod.module_type);
        }
      });

      const summaries: PaperSummary[] = (papers || []).map((paper) => ({
        id: paper.id,
        title: paper.title,
        paperType: paper.paper_type,
        isActive: !!paper.is_active,
        createdAt: paper.created_at,
        modulesCount: moduleCountsByPaper[paper.id] || 0,
        moduleTypes: Array.from(moduleTypesByPaper[paper.id] || []),
      }));

      const publishedPapers = summaries.filter((p) => p.isActive).length;

      setCenterPapers(summaries);
      setCenterModuleStats({
        totalPapers: summaries.length,
        totalModules: (modules || []).length,
        publishedPapers,
        draftPapers: summaries.length - publishedPapers,
      });
    } catch (err) {
      console.error("Error fetching module overview:", err);
      setCenterPapers([]);
      setCenterModuleStats({
        totalPapers: 0,
        totalModules: 0,
        publishedPapers: 0,
        draftPapers: 0,
      });
      setCenterModulesError(
        err instanceof Error ? err.message : "Failed to load modules",
      );
    } finally {
      setCenterModulesLoading(false);
    }
  };

  const refreshCenterModules = async () => {
    if (!currentCenter?.center_id) return;
    await fetchCenterModules(currentCenter.center_id);
  };

  useEffect(() => {
    if (!currentCenter?.center_id) {
      setCenterPapers([]);
      setCenterModuleStats(null);
      setCenterModulesError(null);
      return;
    }

    fetchCenterModules(currentCenter.center_id);
  }, [currentCenter?.center_id]);

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
          section.id === sectionId ? { ...section, title } : section,
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
          section.id === sectionId ? { ...section, heading } : section,
        ),
      },
    }));
  };

  const updateReadingSectionInstruction = (
    sectionId: string,
    instruction: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId ? { ...section, instruction } : section,
        ),
      },
    }));
  };

  const updateReadingSectionPassageText = (
    sectionId: string,
    content: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) =>
          section.id === sectionId
            ? { ...section, passageText: content }
            : section,
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
            : section,
        ),
      },
    }));
  };

  const updateReadingRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
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
                  idx === blockIndex ? block : b,
                ),
              }
            : section,
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
                  (_, idx) => idx !== blockIndex,
                ),
              }
            : section,
        ),
      },
    }));
  };

  const updateReadingQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
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
            : section,
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

  const updateReadingQuestionRef = (
    sectionId: string,
    fromRef: string,
    toRef: string,
  ) => {
    if (!toRef || toRef === fromRef) return;
    setModuleData((prev) => ({
      ...prev,
      reading: {
        ...prev.reading,
        sections: prev.reading.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (section.questions[toRef]) return section;
          const { [fromRef]: existing, ...rest } = section.questions;
          if (!existing) return section;
          return {
            ...section,
            questions: {
              ...rest,
              [toRef]: existing,
            },
          };
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
          section.id === sectionId ? { ...section, title } : section,
        ),
      },
    }));
  };

  const updateListeningSectionInstruction = (
    sectionId: string,
    instruction: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, instruction } : section,
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
          section.id === sectionId ? { ...section, audioPath: path } : section,
        ),
      },
    }));
  };

  const updateListeningSectionAudio = (
    sectionId: string,
    file: File | null,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) =>
          section.id === sectionId ? { ...section, audioFile: file } : section,
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
            : section,
        ),
      },
    }));
  };

  const updateListeningRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
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
                  idx === blockIndex ? block : b,
                ),
              }
            : section,
        ),
      },
    }));
  };

  const deleteListeningRenderBlock = (
    sectionId: string,
    blockIndex: number,
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
                  (_, idx) => idx !== blockIndex,
                ),
              }
            : section,
        ),
      },
    }));
  };

  const updateListeningQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
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
            : section,
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

  const updateListeningQuestionRef = (
    sectionId: string,
    fromRef: string,
    toRef: string,
  ) => {
    if (!toRef || toRef === fromRef) return;
    setModuleData((prev) => ({
      ...prev,
      listening: {
        ...prev.listening,
        sections: prev.listening.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (section.questions[toRef]) return section;
          const { [fromRef]: existing, ...rest } = section.questions;
          if (!existing) return section;
          return {
            ...section,
            questions: {
              ...rest,
              [toRef]: existing,
            },
          };
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
    value: any,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId ? { ...task, [field]: value } : task,
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
            : task,
        ),
      },
    }));
  };

  const updateWritingRenderBlock = (
    taskId: number,
    blockIndex: number,
    block: RenderBlock,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: {
        tasks: prev.writing.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                renderBlocks: task.renderBlocks.map((b, idx) =>
                  idx === blockIndex ? block : b,
                ),
              }
            : task,
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
                  (_, idx) => idx !== blockIndex,
                ),
              }
            : task,
        ),
      },
    }));
  };

  const value: ModuleContextType = {
    moduleData,
    moduleTitles: moduleData.moduleTitles,
    setModuleTitle,

    centerPapers,
    centerModuleStats,
    centerModulesLoading,
    centerModulesError,
    refreshCenterModules,

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
    updateReadingQuestionRef,
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
    updateListeningQuestionRef,
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
