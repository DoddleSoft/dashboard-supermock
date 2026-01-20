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
import {
  createCompletePaper,
  createModule as createModuleInDB,
  uploadAudioFile,
  ModuleType,
} from "@/helpers/modules";
import { readingHelpers } from "@/helpers/reading";
import { listeningHelpers } from "@/helpers/listening";
import { writingHelpers } from "@/helpers/writing";
import { centerHelpers } from "@/helpers/centers";
import { moduleHelpers } from "@/helpers/modules";

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
  correctAnswers?: string[];
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

export interface WritingSection {
  id: string;
  heading: string;
  subheading?: string;
  instruction?: string;
  timeMinutes?: number;
  minWords?: number;
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
    sections: WritingSection[];
    expandedSections: string[];
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
  deleteReadingSection: (sectionId: string) => void;

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
  deleteListeningSection: (sectionId: string) => void;

  // Writing module methods
  writingSections: WritingSection[];
  writingExpandedSections: string[];
  addWritingSection: () => void;
  deleteWritingSection: (sectionId: string) => void;
  toggleWritingSection: (sectionId: string) => void;
  updateWritingSectionHeading: (sectionId: string, heading: string) => void;
  updateWritingSectionSubheading: (
    sectionId: string,
    subheading: string,
  ) => void;
  updateWritingSectionInstruction: (
    sectionId: string,
    instruction: string,
  ) => void;
  updateWritingSectionTime: (sectionId: string, timeMinutes: number) => void;
  updateWritingSectionMinWords: (sectionId: string, minWords: number) => void;
  addWritingRenderBlock: (sectionId: string, block: RenderBlock) => void;
  updateWritingRenderBlock: (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => void;
  deleteWritingRenderBlock: (sectionId: string, blockIndex: number) => void;

  // Save/Create methods
  saveModule: (
    moduleType: ModuleType,
    paperTitle: string,
    paperType?: "IELTS" | "OIETC" | "GRE",
  ) => Promise<{
    success: boolean;
    paperId?: string;
    moduleId?: string;
    error?: string;
  }>;
  saveCompletePaper: (
    paperTitle: string,
    paperType?: "IELTS" | "OIETC" | "GRE",
  ) => Promise<{
    success: boolean;
    paperId?: string;
    moduleIds?: Record<string, string>;
    error?: string;
  }>;
  isSaving: boolean;
  saveError: string | null;
  clearSaveError: () => void;
  resetModuleData: () => void;

  // Utility
  generateId: () => string;
}

// Create context
const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Default module data for reset
const getDefaultModuleData = (): ModuleData => ({
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
    sections: [
      {
        id: "1",
        heading: "Writing Task 1",
        subheading: "",
        renderBlocks: [],
      },
    ],
    expandedSections: ["1"],
  },
  moduleTitles: {
    reading: "",
    writing: "",
    listening: "",
    speaking: "",
  },
});

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

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const clearSaveError = () => setSaveError(null);

  const generateId = () => {
    const id = idCounterRef.current.toString();
    idCounterRef.current += 1;
    return id;
  };

  // Initialize module data with default values
  const [moduleData, setModuleData] = useState<ModuleData>(
    getDefaultModuleData(),
  );

  // Reset module data to defaults
  const resetModuleData = () => {
    setModuleData(getDefaultModuleData());
    idCounterRef.current = 2;
  };

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
    setCenterModulesLoading(true);
    setCenterModulesError(null);

    const result = await centerHelpers.fetchCenterModules(centerId);

    setCenterPapers(result.papers);
    setCenterModuleStats(result.stats);
    if (result.error) {
      setCenterModulesError(result.error);
    }
    setCenterModulesLoading(false);
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
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.addSection(prev.reading, generateId),
    }));
  };

  const updateReadingSectionTitle = (sectionId: string, title: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateSectionTitle(
        prev.reading,
        sectionId,
        title,
      ),
    }));
  };

  const updateReadingSectionHeading = (sectionId: string, heading: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateSectionHeading(
        prev.reading,
        sectionId,
        heading,
      ),
    }));
  };

  const updateReadingSectionInstruction = (
    sectionId: string,
    instruction: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateSectionInstruction(
        prev.reading,
        sectionId,
        instruction,
      ),
    }));
  };

  const updateReadingSectionPassageText = (
    sectionId: string,
    content: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateSectionPassageText(
        prev.reading,
        sectionId,
        content,
      ),
    }));
  };

  const addReadingRenderBlock = (sectionId: string, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.addRenderBlock(prev.reading, sectionId, block),
    }));
  };

  const updateReadingRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateRenderBlock(
        prev.reading,
        sectionId,
        blockIndex,
        block,
      ),
    }));
  };

  const deleteReadingRenderBlock = (sectionId: string, blockIndex: number) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.deleteRenderBlock(
        prev.reading,
        sectionId,
        blockIndex,
      ),
    }));
  };

  const updateReadingQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateQuestion(
        prev.reading,
        sectionId,
        questionRef,
        data,
      ),
    }));
  };

  const deleteReadingQuestion = (sectionId: string, questionRef: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.deleteQuestion(
        prev.reading,
        sectionId,
        questionRef,
      ),
    }));
  };

  const updateReadingQuestionRef = (
    sectionId: string,
    fromRef: string,
    toRef: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.updateQuestionRef(
        prev.reading,
        sectionId,
        fromRef,
        toRef,
      ),
    }));
  };

  const toggleReadingSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.toggleSection(prev.reading, sectionId),
    }));
  };

  const deleteReadingSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      reading: readingHelpers.deleteSection(prev.reading, sectionId),
    }));
  };

  // ========== LISTENING MODULE METHODS ==========

  const addListeningSection = () => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.addSection(prev.listening, generateId),
    }));
  };

  const updateListeningSectionTitle = (sectionId: string, title: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateSectionTitle(
        prev.listening,
        sectionId,
        title,
      ),
    }));
  };

  const updateListeningSectionInstruction = (
    sectionId: string,
    instruction: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateSectionInstruction(
        prev.listening,
        sectionId,
        instruction,
      ),
    }));
  };

  const updateListeningSectionAudioPath = (sectionId: string, path: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateSectionAudioPath(
        prev.listening,
        sectionId,
        path,
      ),
    }));
  };

  const updateListeningSectionAudio = (
    sectionId: string,
    file: File | null,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateSectionAudio(
        prev.listening,
        sectionId,
        file,
      ),
    }));
  };

  const addListeningRenderBlock = (sectionId: string, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.addRenderBlock(
        prev.listening,
        sectionId,
        block,
      ),
    }));
  };

  const updateListeningRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateRenderBlock(
        prev.listening,
        sectionId,
        blockIndex,
        block,
      ),
    }));
  };

  const deleteListeningRenderBlock = (
    sectionId: string,
    blockIndex: number,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.deleteRenderBlock(
        prev.listening,
        sectionId,
        blockIndex,
      ),
    }));
  };

  const updateListeningQuestion = (
    sectionId: string,
    questionRef: string,
    data: QuestionDefinition,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateQuestion(
        prev.listening,
        sectionId,
        questionRef,
        data,
      ),
    }));
  };

  const deleteListeningQuestion = (sectionId: string, questionRef: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.deleteQuestion(
        prev.listening,
        sectionId,
        questionRef,
      ),
    }));
  };

  const updateListeningQuestionRef = (
    sectionId: string,
    fromRef: string,
    toRef: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.updateQuestionRef(
        prev.listening,
        sectionId,
        fromRef,
        toRef,
      ),
    }));
  };

  const toggleListeningSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.toggleSection(prev.listening, sectionId),
    }));
  };

  const deleteListeningSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      listening: listeningHelpers.deleteSection(prev.listening, sectionId),
    }));
  };

  // ========== WRITING MODULE METHODS ==========

  // ========== WRITING MODULE METHODS ==========

  const addWritingSection = () => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.addSection(prev.writing, generateId),
    }));
  };

  const deleteWritingSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.deleteSection(prev.writing, sectionId),
    }));
  };

  const toggleWritingSection = (sectionId: string) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.toggleSection(prev.writing, sectionId),
    }));
  };

  const updateWritingSectionHeading = (sectionId: string, heading: string) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateSectionHeading(
        prev.writing,
        sectionId,
        heading,
      ),
    }));
  };

  const updateWritingSectionSubheading = (
    sectionId: string,
    subheading: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateSectionSubheading(
        prev.writing,
        sectionId,
        subheading,
      ),
    }));
  };

  const updateWritingSectionInstruction = (
    sectionId: string,
    instruction: string,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateSectionInstruction(
        prev.writing,
        sectionId,
        instruction,
      ),
    }));
  };

  const updateWritingSectionTime = (sectionId: string, timeMinutes: number) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateSectionTime(
        prev.writing,
        sectionId,
        timeMinutes,
      ),
    }));
  };

  const updateWritingSectionMinWords = (
    sectionId: string,
    minWords: number,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateSectionMinWords(
        prev.writing,
        sectionId,
        minWords,
      ),
    }));
  };

  const addWritingRenderBlock = (sectionId: string, block: RenderBlock) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.addRenderBlock(prev.writing, sectionId, block),
    }));
  };

  const updateWritingRenderBlock = (
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.updateRenderBlock(
        prev.writing,
        sectionId,
        blockIndex,
        block,
      ),
    }));
  };

  const deleteWritingRenderBlock = (sectionId: string, blockIndex: number) => {
    setModuleData((prev) => ({
      ...prev,
      writing: writingHelpers.deleteRenderBlock(
        prev.writing,
        sectionId,
        blockIndex,
      ),
    }));
  };

  // ========== SAVE/CREATE METHODS ==========

  /**
   * Upload audio files for listening sections and update paths
   */
  const uploadListeningAudioFiles = async (
    centerId: string,
    sections: ListeningSection[],
  ): Promise<ListeningSection[]> => {
    return await listeningHelpers.uploadAudioFiles(centerId, sections);
  };

  /**
   * Save a single module with its sections
   */
  const saveModule = async (
    moduleType: ModuleType,
    moduleTitle: string,
    paperType: "IELTS" | "OIETC" | "GRE" = "IELTS",
  ): Promise<{
    success: boolean;
    paperId?: string;
    moduleId?: string;
    error?: string;
  }> => {
    if (!currentCenter?.center_id) {
      return { success: false, error: "No center selected" };
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await moduleHelpers.saveModule(
        currentCenter.center_id,
        moduleType,
        moduleTitle,
        moduleData.moduleTitles,
        moduleData.reading.sections,
        moduleData.listening.sections,
        moduleData.writing.sections,
      );

      if (!result.success) {
        setSaveError(result.error || "Failed to save module");
        return result;
      }

      // Refresh center modules list
      await refreshCenterModules();

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save module";
      setSaveError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save a complete paper with all configured modules
   */
  const saveCompletePaper = async (
    paperTitle: string,
    paperType: "IELTS" | "OIETC" | "GRE" = "IELTS",
  ): Promise<{
    success: boolean;
    paperId?: string;
    moduleIds?: Record<string, string>;
    error?: string;
  }> => {
    if (!currentCenter?.center_id) {
      return { success: false, error: "No center selected" };
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Upload listening audio files
      const uploadedListeningSections = await uploadListeningAudioFiles(
        currentCenter.center_id,
        moduleData.listening.sections,
      );

      const result = await moduleHelpers.saveCompletePaper(
        currentCenter.center_id,
        paperTitle,
        paperType,
        moduleData.moduleTitles,
        moduleData.reading.sections,
        uploadedListeningSections,
        moduleData.writing.sections,
      );

      if (!result.success) {
        setSaveError(result.error || "Failed to create paper");
        return result;
      }

      // Refresh center modules list
      await refreshCenterModules();

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create paper";
      setSaveError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
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
    deleteReadingSection,

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
    deleteListeningSection,

    // Writing
    writingSections: moduleData.writing.sections,
    writingExpandedSections: moduleData.writing.expandedSections,
    addWritingSection,
    deleteWritingSection,
    toggleWritingSection,
    updateWritingSectionHeading,
    updateWritingSectionSubheading,
    updateWritingSectionInstruction,
    updateWritingSectionTime,
    updateWritingSectionMinWords,
    addWritingRenderBlock,
    updateWritingRenderBlock,
    deleteWritingRenderBlock,

    // Save/Create
    saveModule,
    saveCompletePaper,
    isSaving,
    saveError,
    clearSaveError,
    resetModuleData,

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
