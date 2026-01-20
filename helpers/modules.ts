import { createClient } from "@/lib/supabase/client";
import {
  ReadingSection,
  ListeningSection,
  WritingTask,
  RenderBlock,
  QuestionDefinition,
} from "@/context/ModuleContext";

export type ModuleType = "reading" | "listening" | "writing" | "speaking";

export interface CreateModulePayload {
  centerId: string;
  paperId?: string;
  moduleType: ModuleType;
  title: string;
  instruction?: string;
  sections?: ReadingSection[] | ListeningSection[];
  tasks?: WritingTask[];
}

export interface CreatePaperPayload {
  centerId: string;
  title: string;
  paperType?: "IELTS" | "OIETC" | "GRE";
  instruction?: string;
}

export interface CreateModuleResult {
  success: boolean;
  paperId?: string;
  moduleId?: string;
  error?: string;
}

const INSERT_CHUNK_SIZE = 100;

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (items.length <= size) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const formatSupabaseError = (err: unknown) => {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;

  const maybeError = err as {
    message?: string;
    code?: string;
    details?: string;
  };
  const message = maybeError.message || "Unknown error";
  const code = maybeError.code ? ` (code: ${maybeError.code})` : "";
  const details = maybeError.details ? ` - ${maybeError.details}` : "";
  return `${message}${code}${details}`;
};

export async function createPaper(
  payload: CreatePaperPayload,
): Promise<{ success: boolean; paperId?: string; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("papers")
      .insert({
        center_id: payload.centerId,
        title: payload.title,
        paper_type: payload.paperType || "IELTS",
        instruction: payload.instruction || null,
        is_active: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    return { success: true, paperId: data.id };
  } catch (err) {
    console.error("Error creating paper:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create paper",
    };
  }
}

export async function createModule(
  payload: CreateModulePayload,
): Promise<CreateModuleResult> {
  const supabase = createClient();

  try {
    // 1. Create the module
    const { data: moduleData, error: moduleError } = await supabase
      .from("modules")
      .insert({
        center_id: payload.centerId,
        paper_id: payload.paperId || null,
        module_type: payload.moduleType,
        heading: payload.title,
        instruction: payload.instruction || null,
      })
      .select("id")
      .single();

    if (moduleError) {
      console.error(
        "[createModule] Module creation error:",
        formatSupabaseError(moduleError),
      );
      throw new Error(
        `Module creation failed: ${moduleError.message || "Unknown error"}`,
      );
    }

    const moduleId = moduleData.id;
    console.log(`[createModule] Module created with ID: ${moduleId}`);

    try {
      // 2. Process sections based on module type
      if (
        payload.moduleType === "reading" &&
        payload.sections &&
        payload.sections.length > 0
      ) {
        console.log(
          `[createModule] Creating ${payload.sections.length} reading sections`,
        );
        await createReadingSections(
          supabase,
          moduleId,
          payload.sections as ReadingSection[],
        );
      } else if (
        payload.moduleType === "listening" &&
        payload.sections &&
        payload.sections.length > 0
      ) {
        console.log(
          `[createModule] Creating ${payload.sections.length} listening sections`,
        );
        await createListeningSections(
          supabase,
          moduleId,
          payload.sections as ListeningSection[],
        );
      } else if (
        payload.moduleType === "writing" &&
        payload.tasks &&
        payload.tasks.length > 0
      ) {
        console.log(
          `[createModule] Creating ${payload.tasks.length} writing tasks`,
        );
        await createWritingSections(supabase, moduleId, payload.tasks);
      }

      console.log(
        `[createModule] Module created successfully with ID: ${moduleId}`,
      );
      return { success: true, moduleId, paperId: payload.paperId };
    } catch (subsectionError) {
      // If subsection creation fails, delete the module to maintain consistency
      console.error(
        "[createModule] Subsection creation failed, rolling back module creation:",
        formatSupabaseError(subsectionError),
      );

      const { error: deleteError } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (deleteError) {
        console.error("[createModule] Failed to rollback module:", deleteError);
      } else {
        console.log(
          `[createModule] Successfully rolled back module ${moduleId}`,
        );
      }

      throw subsectionError;
    }
  } catch (err) {
    console.error("[createModule] Error:", formatSupabaseError(err));
    return {
      success: false,
      error: formatSupabaseError(err),
    };
  }
}

async function createReadingSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  sections: ReadingSection[],
): Promise<void> {
  const sectionIds = sections.map(() => crypto.randomUUID());
  const sectionsToInsert = sections.map((section, sectionIndex) => ({
    id: sectionIds[sectionIndex],
    module_id: moduleId,
    title: section.title,
    section_index: sectionIndex + 1,
    content_type: "text",
    content_text: section.passageText || null,
    instruction: section.instruction || null,
  }));

  const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
  const sectionResults = await Promise.all(
    sectionChunks.map((chunk) => supabase.from("sections").insert(chunk)),
  );

  for (const result of sectionResults) {
    if (result.error) throw result.error;
  }

  const subSectionCreationPromises = sections.map((section, index) =>
    createSubSectionsFromBlocks(
      supabase,
      sectionIds[index],
      section.renderBlocks,
      section.questions,
    ),
  );

  await Promise.all(subSectionCreationPromises);
}

async function createListeningSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  sections: ListeningSection[],
): Promise<void> {
  const sectionIds = sections.map(() => crypto.randomUUID());
  const sectionsToInsert = sections.map((section, sectionIndex) => ({
    id: sectionIds[sectionIndex],
    module_id: moduleId,
    title: section.title,
    section_index: sectionIndex + 1,
    content_type: "audio",
    resource_url: section.audioPath || null,
    instruction: section.instruction || null,
  }));

  const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
  const sectionResults = await Promise.all(
    sectionChunks.map((chunk) => supabase.from("sections").insert(chunk)),
  );

  for (const result of sectionResults) {
    if (result.error) throw result.error;
  }

  const subSectionCreationPromises = sections.map((section, index) =>
    createSubSectionsFromBlocks(
      supabase,
      sectionIds[index],
      section.renderBlocks,
      section.questions,
    ),
  );

  await Promise.all(subSectionCreationPromises);
}

async function createWritingSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  tasks: WritingTask[],
): Promise<void> {
  const hasMeaningfulContent = (block: RenderBlock) => {
    const content = (block.content || "").trim();
    const boundary = (block.questions || "").trim();
    return content.length > 0 || boundary.length > 0;
  };

  const sectionIds = tasks.map(() => crypto.randomUUID());
  const sectionsToInsert = tasks.map((task, taskIndex) => ({
    id: sectionIds[taskIndex],
    module_id: moduleId,
    title: task.title,
    section_index: taskIndex + 1,
    content_type: "text" as const,
    instruction: `Write at least ${task.wordCountMin} words. Recommended time: ${task.durationRecommendation} minutes.`,
  }));

  const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
  const sectionResults = await Promise.all(
    sectionChunks.map((chunk) => supabase.from("sections").insert(chunk)),
  );

  for (const result of sectionResults) {
    if (result.error) throw result.error;
  }

  const subSectionsToInsert = tasks.flatMap((task, index) => {
    const sectionId = sectionIds[index];
    const meaningfulBlocks = task.renderBlocks.filter(hasMeaningfulContent);
    return meaningfulBlocks.map((block) => ({
      id: crypto.randomUUID(),
      section_id: sectionId,
      boundary_text: block.questions || null,
      sub_type: block.type === "editor" ? "editor" : block.type,
      content_template: block.content || "",
      resource_url: block.type === "image" ? block.content : null,
    }));
  });

  if (subSectionsToInsert.length > 0) {
    const subSectionChunks = chunkArray(subSectionsToInsert, INSERT_CHUNK_SIZE);
    const subSectionResults = await Promise.all(
      subSectionChunks.map((chunk) =>
        supabase.from("sub_sections").insert(chunk),
      ),
    );

    for (const result of subSectionResults) {
      if (result.error) throw result.error;
    }
  }
}

async function createSubSectionsFromBlocks(
  supabase: ReturnType<typeof createClient>,
  sectionId: string,
  renderBlocks: RenderBlock[],
  questions: Record<string, QuestionDefinition>,
): Promise<void> {
  const questionRefsInBlocks = new Set<string>();
  const subSectionsToInsert: Array<{
    id: string;
    section_id: string;
    boundary_text: string | null;
    sub_type: string;
    content_template: string;
    resource_url: string | null;
  }> = [];

  const blockQuestionRefs: string[][] = [];
  const subSectionIndexByKey = new Map<string, number>();

  const hasMeaningfulContent = (block: RenderBlock) => {
    const content = (block.content || "").trim();
    const boundary = (block.questions || "").trim();
    return content.length > 0 || boundary.length > 0;
  };

  const meaningfulBlocks = renderBlocks.filter(hasMeaningfulContent);

  if (meaningfulBlocks.length === 0) {
    if (Object.keys(questions).length > 0) {
      console.warn(
        "[createSubSectionsFromBlocks] No render blocks with content; skipping sub-section insert to avoid dummy data.",
      );
    }
    return;
  }

  meaningfulBlocks.forEach((block) => {
    const boundaryText = block.questions || null;
    const contentTemplate = block.content || "";
    const resourceUrl = block.type === "image" ? block.content : null;
    const dedupeKey = `${block.type}::${boundaryText ?? ""}::${contentTemplate}::${resourceUrl ?? ""}`;

    const refs = extractQuestionRefs(block.content);
    refs.forEach((ref) => questionRefsInBlocks.add(ref));

    const existingIndex = subSectionIndexByKey.get(dedupeKey);
    if (existingIndex !== undefined) {
      const mergedRefs = new Set(blockQuestionRefs[existingIndex] || []);
      refs.forEach((ref) => mergedRefs.add(ref));
      blockQuestionRefs[existingIndex] = Array.from(mergedRefs);
      return;
    }

    const subSectionId = crypto.randomUUID();
    subSectionIndexByKey.set(dedupeKey, subSectionsToInsert.length);
    blockQuestionRefs.push(refs);

    subSectionsToInsert.push({
      id: subSectionId,
      section_id: sectionId,
      boundary_text: boundaryText,
      sub_type: block.type,
      content_template: contentTemplate,
      resource_url: resourceUrl,
    });
  });

  const orphanedQuestionRefs = Object.keys(questions).filter(
    (ref) => !questionRefsInBlocks.has(ref),
  );

  if (subSectionsToInsert.length > 0) {
    const subSectionChunks = chunkArray(subSectionsToInsert, INSERT_CHUNK_SIZE);
    const subSectionResults = await Promise.all(
      subSectionChunks.map((chunk) =>
        supabase.from("sub_sections").insert(chunk),
      ),
    );

    for (const result of subSectionResults) {
      if (result.error) {
        console.error(
          "[createSubSectionsFromBlocks] Sub-sections batch insert error:",
          result.error,
        );
        throw result.error;
      }
    }
  }

  const questionsToInsert: Array<{
    sub_section_id: string;
    question_ref: string;
    correct_answers: string[] | null;
    options: string[] | null;
    explanation: string | null;
    marks: number;
  }> = [];

  blockQuestionRefs.forEach((refs, index) => {
    const subSectionId = subSectionsToInsert[index]?.id;
    if (!subSectionId) return;

    refs.forEach((ref) => {
      const questionDef = questions[ref];
      if (!questionDef) return;

      questionsToInsert.push({
        sub_section_id: subSectionId,
        question_ref: ref,
        correct_answers:
          questionDef.correctAnswers && questionDef.correctAnswers.length
            ? questionDef.correctAnswers
            : questionDef.answer
              ? [questionDef.answer]
              : null,
        options: questionDef.options ?? null,
        explanation: questionDef.explanation || null,
        marks: 1.0,
      });
    });
  });

  if (orphanedQuestionRefs.length > 0) {
    const fallbackSubSectionId = subSectionsToInsert[0]?.id || null;

    if (fallbackSubSectionId) {
      orphanedQuestionRefs.forEach((ref) => {
        const questionDef = questions[ref];
        if (!questionDef) return;

        questionsToInsert.push({
          sub_section_id: fallbackSubSectionId,
          question_ref: ref,
          correct_answers:
            questionDef.correctAnswers && questionDef.correctAnswers.length
              ? questionDef.correctAnswers
              : questionDef.answer
                ? [questionDef.answer]
                : null,
          options: questionDef.options ?? null,
          explanation: questionDef.explanation || null,
          marks: 1.0,
        });
      });
    }
  }

  if (questionsToInsert.length > 0) {
    const questionChunks = chunkArray(questionsToInsert, INSERT_CHUNK_SIZE);
    const questionResults = await Promise.all(
      questionChunks.map((chunk) =>
        supabase.from("question_answers").insert(chunk),
      ),
    );

    for (const result of questionResults) {
      if (result.error) {
        console.error(
          "[createSubSectionsFromBlocks] Question answers batch insert error:",
          result.error,
        );
        throw result.error;
      }
    }
  }
}

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

  return Array.from(refs);
}

export async function createCompletePaper(
  centerId: string,
  paperTitle: string,
  paperType: "IELTS" | "OIETC" | "GRE",
  modules: {
    reading?: {
      title: string;
      instruction?: string;
      sections: ReadingSection[];
    };
    listening?: {
      title: string;
      instruction?: string;
      sections: ListeningSection[];
    };
    writing?: {
      title: string;
      instruction?: string;
      tasks: WritingTask[];
    };
  },
): Promise<{
  success: boolean;
  paperId?: string;
  moduleIds?: Record<string, string>;
  error?: string;
}> {
  try {
    // 1. Create the paper
    const paperResult = await createPaper({
      centerId,
      title: paperTitle,
      paperType,
    });

    if (!paperResult.success || !paperResult.paperId) {
      return { success: false, error: paperResult.error };
    }

    const paperId = paperResult.paperId;
    const moduleIds: Record<string, string> = {};

    // 2. Create reading module if provided
    if (modules.reading && modules.reading.sections.length > 0) {
      const result = await createModule({
        centerId,
        paperId,
        moduleType: "reading",
        title: modules.reading.title || "Reading Module",
        instruction: modules.reading.instruction,
        sections: modules.reading.sections,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }
      moduleIds.reading = result.moduleId!;
    }

    // 3. Create listening module if provided
    if (modules.listening && modules.listening.sections.length > 0) {
      const result = await createModule({
        centerId,
        paperId,
        moduleType: "listening",
        title: modules.listening.title || "Listening Module",
        instruction: modules.listening.instruction,
        sections: modules.listening.sections,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }
      moduleIds.listening = result.moduleId!;
    }

    // 4. Create writing module if provided
    if (modules.writing && modules.writing.tasks.length > 0) {
      const result = await createModule({
        centerId,
        paperId,
        moduleType: "writing",
        title: modules.writing.title || "Writing Module",
        instruction: modules.writing.instruction,
        tasks: modules.writing.tasks,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }
      moduleIds.writing = result.moduleId!;
    }

    return { success: true, paperId, moduleIds };
  } catch (err) {
    console.error("Error creating complete paper:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create paper",
    };
  }
}

/**
 * Upload media file (image or audio) to Supabase storage
 * Path structure: {user_id}/{center_id}/{module_type}/{timestamp}_{filename}
 */
export async function uploadMediaFile(
  centerId: string,
  moduleType: string,
  file: File,
  fileType: "image" | "audio",
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Get current user ID for storage policy compliance
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Construct file path: {user_id}/{center_id}/{module_type}/{type}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/${centerId}/${moduleType}/${fileType}/${timestamp}_${sanitizedFileName}`;

    const { data, error } = await supabase.storage
      .from("media_files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("media_files").getPublicUrl(data.path);

    return { success: true, url: publicUrl };
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error(`Error uploading ${fileType} file:`, err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : `Failed to upload ${fileType}`,
    };
  }
}

/**
 * Legacy function - redirects to uploadMediaFile
 * @deprecated Use uploadMediaFile instead
 */
export async function uploadAudioFile(
  centerId: string,
  sectionId: string,
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> {
  return uploadMediaFile(centerId, "listening", file, "audio");
}

export const moduleHelpers = {
  saveModule: async (
    centerId: string,
    moduleType: ModuleType,
    moduleTitle: string,
    moduleTitles: Record<string, string>,
    readingSections?: ReadingSection[],
    listeningSections?: ListeningSection[],
    writingTasks?: WritingTask[],
  ): Promise<{
    success: boolean;
    paperId?: string;
    moduleId?: string;
    error?: string;
  }> => {
    try {
      console.log("[saveModule] Starting save process:", {
        centerId,
        moduleType,
        moduleTitle,
        hasReadingSections: !!(readingSections && readingSections.length > 0),
        readingSectionCount: readingSections?.length || 0,
        hasListeningSections: !!(
          listeningSections && listeningSections.length > 0
        ),
        listeningSectionCount: listeningSections?.length || 0,
        hasWritingTasks: !!(writingTasks && writingTasks.length > 0),
        writingTaskCount: writingTasks?.length || 0,
      });

      let sections: ReadingSection[] | ListeningSection[] | undefined;
      let tasks: WritingTask[] | undefined;
      const title =
        moduleTitle || moduleTitles[moduleType] || `${moduleType} Module`;

      console.log("[saveModule] Using title:", title);

      if (moduleType === "reading" && readingSections) {
        const { readingHelpers } = await import("@/helpers/reading");
        sections = await readingHelpers.uploadImages(centerId, readingSections);
      } else if (moduleType === "listening" && listeningSections) {
        const { listeningHelpers } = await import("@/helpers/listening");
        let sectionsWithAudio = await listeningHelpers.uploadAudioFiles(
          centerId,
          listeningSections,
        );
        sections = await listeningHelpers.uploadImages(
          centerId,
          sectionsWithAudio,
        );
      } else if (moduleType === "writing" && writingTasks) {
        const { writingHelpers } = await import("@/helpers/writing");
        tasks = await writingHelpers.uploadImages(centerId, writingTasks);
      }

      const result = await createModule({
        centerId,
        moduleType,
        title,
        sections: sections as ReadingSection[] | ListeningSection[],
        tasks,
      });

      return result;
    } catch (err) {
      console.error(
        "[saveModule] Error:",
        err instanceof Error ? err.message : String(err),
      );
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save module";
      return { success: false, error: errorMsg };
    }
  },

  saveCompletePaper: async (
    centerId: string,
    paperTitle: string,
    paperType: "IELTS" | "OIETC" | "GRE",
    moduleTitles: Record<string, string>,
    readingSections: ReadingSection[],
    listeningSections: ListeningSection[],
    writingTasks: WritingTask[],
  ): Promise<{
    success: boolean;
    paperId?: string;
    moduleIds?: Record<string, string>;
    error?: string;
  }> => {
    try {
      // Import helpers dynamically
      const { readingHelpers } = await import("@/helpers/reading");
      const { listeningHelpers } = await import("@/helpers/listening");
      const { writingHelpers } = await import("@/helpers/writing");

      // Upload all media files
      const uploadedReadingSections = await readingHelpers.uploadImages(
        centerId,
        readingSections,
      );

      // For listening, upload audio files first, then images
      let uploadedListeningSections = await listeningHelpers.uploadAudioFiles(
        centerId,
        listeningSections,
      );
      uploadedListeningSections = await listeningHelpers.uploadImages(
        centerId,
        uploadedListeningSections,
      );

      const uploadedWritingTasks = await writingHelpers.uploadImages(
        centerId,
        writingTasks,
      );

      const modules: Parameters<typeof createCompletePaper>[3] = {};

      // Only include modules that have content
      const hasReadingContent = uploadedReadingSections.some(
        (s) =>
          s.renderBlocks.length > 0 ||
          s.passageText ||
          Object.keys(s.questions).length > 0,
      );
      const hasListeningContent = uploadedListeningSections.some(
        (s) =>
          s.renderBlocks.length > 0 ||
          s.audioPath ||
          Object.keys(s.questions).length > 0,
      );
      const hasWritingContent = uploadedWritingTasks.some(
        (t) => t.renderBlocks.length > 0,
      );

      if (hasReadingContent) {
        modules.reading = {
          title: moduleTitles.reading || "Reading Module",
          sections: uploadedReadingSections,
        };
      }

      if (hasListeningContent) {
        modules.listening = {
          title: moduleTitles.listening || "Listening Module",
          sections: uploadedListeningSections,
        };
      }

      if (hasWritingContent) {
        modules.writing = {
          title: moduleTitles.writing || "Writing Module",
          tasks: uploadedWritingTasks,
        };
      }

      const result = await createCompletePaper(
        centerId,
        paperTitle,
        paperType,
        modules,
      );

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create paper";
      return { success: false, error: errorMsg };
    }
  },
};
