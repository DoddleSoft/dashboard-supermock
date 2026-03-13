import { createClient } from "@/lib/supabase/client";
import {
  ReadingSection,
  ListeningSection,
  WritingSection,
  RenderBlock,
  QuestionDefinition,
} from "@/context/ModuleContext";
import { compressImage, compressAudio } from "@/lib/mediaCompression";
import { toast } from "sonner";

export type ModuleType = "reading" | "listening" | "writing" | "speaking";

export interface CreateModulePayload {
  centerId: string;
  paperId?: string;
  moduleType: ModuleType;
  title: string;
  instruction?: string;
  sections?: ReadingSection[] | ListeningSection[] | WritingSection[];
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
      const errorMsg = `Module creation failed. Please try again.`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    const moduleId = moduleData.id;

    try {
      // 2. Process sections based on module type
      if (
        payload.moduleType === "reading" &&
        payload.sections &&
        payload.sections.length > 0
      ) {
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
        await createListeningSections(
          supabase,
          moduleId,
          payload.sections as ListeningSection[],
        );
      } else if (
        payload.moduleType === "writing" &&
        payload.sections &&
        payload.sections.length > 0
      ) {
        await createWritingSections(
          supabase,
          moduleId,
          payload.sections as WritingSection[],
        );
      }

      toast.success("Module created successfully!");
      return { success: true, moduleId, paperId: payload.paperId };
    } catch (subsectionError) {
      // Rollback: delete the module we just created
      const { error: deleteError } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId);

      if (deleteError) {
        toast.error("Failed to rollback changes. Please contact support.");
      }

      throw subsectionError;
    }
  } catch (err) {
    const errorMessage = formatSupabaseError(err);

    // Only show toast if it's not already shown by child functions
    if (!errorMessage.includes("upload") && !errorMessage.includes("size")) {
      toast.error("Module creation failed. Please try again.");
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

async function createReadingSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  sections: ReadingSection[],
): Promise<void> {
  if (!sections || sections.length === 0) {
    return;
  }

  const sectionsToInsert = sections.map((section, sectionIndex) => ({
    module_id: moduleId,
    title: section.title,
    section_index: sectionIndex + 1,
    content_type: "text",
    content_text: section.passageText || null,
    instruction: section.instruction || null,
    subtext: section.heading || null,
  }));

  const sectionIds: string[] = [];
  const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
  for (const chunk of sectionChunks) {
    const { data, error } = await supabase
      .from("sections")
      .insert(chunk)
      .select("id");
    if (error) throw error;
    sectionIds.push(...(data || []).map((r: { id: string }) => r.id));
  }

  // Batch all sub_sections and questions across all sections into single inserts
  await batchCreateSubSectionsAndQuestions(
    supabase,
    sections.map((section, index) => ({
      sectionId: sectionIds[index],
      renderBlocks: section.renderBlocks,
      questions: section.questions,
    })),
  );
}

async function createListeningSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  sections: ListeningSection[],
): Promise<void> {
  if (!sections || sections.length === 0) {
    return;
  }

  const sectionsToInsert = sections.map((section, sectionIndex) => ({
    module_id: moduleId,
    title: section.title,
    section_index: sectionIndex + 1,
    content_type: "audio",
    resource_url: section.audioPath || null,
    instruction: section.instruction || null,
  }));

  const sectionIds: string[] = [];
  const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
  for (const chunk of sectionChunks) {
    const { data, error } = await supabase
      .from("sections")
      .insert(chunk)
      .select("id");
    if (error) throw error;
    sectionIds.push(...(data || []).map((r: { id: string }) => r.id));
  }

  // Batch all sub_sections and questions across all sections into single inserts
  await batchCreateSubSectionsAndQuestions(
    supabase,
    sections.map((section, index) => ({
      sectionId: sectionIds[index],
      renderBlocks: section.renderBlocks,
      questions: section.questions,
    })),
  );
}

async function createWritingSections(
  supabase: ReturnType<typeof createClient>,
  moduleId: string,
  sections: WritingSection[],
): Promise<void> {
  if (!sections || sections.length === 0) {
    return;
  }

  // For writing module, each render block becomes a separate section row
  // All blocks from the same WritingSection share the same metadata (title, subheading, instruction, params)

  const sectionsToInsert: Array<{
    module_id: string;
    title: string;
    section_index: number;
    content_type: "text" | "image";
    content_text: string | null;
    instruction: string | null;
    params: { timeMinutes?: number; minWords?: number };
    subtext: string | null;
    resource_url: string | null;
  }> = [];

  let globalIndex = 0;

  sections.forEach((section: WritingSection) => {
    // Each render block becomes its own section row
    section.renderBlocks.forEach((block: RenderBlock) => {
      globalIndex++;

      const contentType = block.type === "image" ? "image" : "text";
      const subtext =
        block.type === "image"
          ? block.label || null // Image: label goes to subtext
          : block.content || null; // Text: content goes to subtext
      const resourceUrl =
        block.type === "image"
          ? block.content || null // Image: URL goes to resource_url
          : null;

      sectionsToInsert.push({
        module_id: moduleId,
        title: section.heading,
        section_index: globalIndex,
        content_type: contentType,
        content_text: section.subheading || null,
        instruction: section.instruction || null,
        params: {
          timeMinutes: section.timeMinutes,
          minWords: section.minWords,
        },
        subtext: subtext,
        resource_url: resourceUrl,
      });
    });
  });

  if (sectionsToInsert.length > 0) {
    const sectionChunks = chunkArray(sectionsToInsert, INSERT_CHUNK_SIZE);
    const sectionResults = await Promise.all(
      sectionChunks.map((chunk) => supabase.from("sections").insert(chunk)),
    );

    for (const result of sectionResults) {
      if (result.error) throw result.error;
    }
  }
}

async function batchCreateSubSectionsAndQuestions(
  supabase: ReturnType<typeof createClient>,
  sectionEntries: Array<{
    sectionId: string;
    renderBlocks: RenderBlock[];
    questions: Record<string, QuestionDefinition>;
  }>,
): Promise<void> {
  const allSubSections: Array<{
    section_id: string;
    boundary_text: string | null;
    sub_type: string;
    content_template: string;
    resource_url: string | null;
    instruction: string | null;
    sub_section_index: number;
  }> = [];

  // Track which sub_section belongs to which section entry for question mapping
  const subSectionMeta: Array<{
    entryIndex: number;
    originalBlockIndex: number;
  }> = [];

  for (let entryIndex = 0; entryIndex < sectionEntries.length; entryIndex++) {
    const entry = sectionEntries[entryIndex];
    const hasMeaningfulContent = (block: RenderBlock) => {
      const content = (block.content || "").trim();
      const boundary = (block.questions || "").trim();
      return content.length > 0 || boundary.length > 0;
    };

    // Track the original renderBlocks index for each meaningful block
    let filteredIdx = 0;
    entry.renderBlocks.forEach((block, originalIndex) => {
      if (!hasMeaningfulContent(block)) return;

      allSubSections.push({
        section_id: entry.sectionId,
        boundary_text: block.questions || null,
        sub_type: block.type,
        content_template: block.content || "",
        resource_url: block.type === "image" ? block.content : null,
        instruction: block.instruction || null,
        sub_section_index: filteredIdx + 1,
      });
      subSectionMeta.push({ entryIndex, originalBlockIndex: originalIndex });
      filteredIdx++;
    });
  }

  // Bulk insert all sub_sections and collect DB-generated IDs
  const subSectionIds: string[] = [];
  if (allSubSections.length > 0) {
    const chunks = chunkArray(allSubSections, INSERT_CHUNK_SIZE);
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from("sub_sections")
        .insert(chunk)
        .select("id");
      if (error) throw error;
      subSectionIds.push(...(data || []).map((r: { id: string }) => r.id));
    }
  }

  // Now collect all questions using DB-generated sub_section IDs
  const allQuestions: Array<{
    sub_section_id: string;
    question_ref: string;
    correct_answers: string[] | null;
    options: string[] | null;
    explanation: string | null;
    marks: number;
  }> = [];

  sectionEntries.forEach((entry, entryIndex) => {
    Object.entries(entry.questions).forEach(([ref, questionDef]) => {
      if (!questionDef) return;

      const blockIndex = questionDef.createdInBlockIndex ?? 0;
      // Find the sub_section ID by matching entryIndex and originalBlockIndex
      const subSectionIdx = subSectionMeta.findIndex(
        (m) =>
          m.entryIndex === entryIndex && m.originalBlockIndex === blockIndex,
      );
      const subSectionId =
        subSectionIdx >= 0 ? subSectionIds[subSectionIdx] : undefined;
      if (!subSectionId) return;

      const isTrueFalse =
        questionDef.type === "true-false" ||
        (questionDef.answer &&
          ["TRUE", "FALSE", "NOT GIVEN"].includes(
            questionDef.answer.toUpperCase(),
          ));

      const finalOptions =
        isTrueFalse &&
        (!questionDef.options || questionDef.options.length === 0)
          ? ["TRUE", "FALSE", "NOT GIVEN"]
          : (questionDef.options ?? null);

      allQuestions.push({
        sub_section_id: subSectionId,
        question_ref: ref,
        correct_answers:
          questionDef.correctAnswers && questionDef.correctAnswers.length
            ? questionDef.correctAnswers
            : questionDef.answer
              ? [questionDef.answer]
              : null,
        options: finalOptions,
        explanation: questionDef.explanation || null,
        marks: 1.0,
      });
    });
  });

  // Bulk insert all questions in one go
  if (allQuestions.length > 0) {
    const chunks = chunkArray(allQuestions, INSERT_CHUNK_SIZE);
    const results = await Promise.all(
      chunks.map((chunk) => supabase.from("question_answers").insert(chunk)),
    );
    for (const result of results) {
      if (result.error) throw result.error;
    }
  }
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
      sections: WritingSection[];
      expandedSections: string[];
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
    if (modules.writing && modules.writing.sections.length > 0) {
      const result = await createModule({
        centerId,
        paperId,
        moduleType: "writing",
        title: modules.writing.title || "Writing Module",
        instruction: modules.writing.instruction,
        sections: modules.writing.sections,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }
      moduleIds.writing = result.moduleId!;
    }

    return { success: true, paperId, moduleIds };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create paper",
    };
  }
}

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
      toast.error("Authentication required");
      return { success: false, error: "User not authenticated" };
    }

    let processedFile = file;
    const MAX_AUDIO_SIZE_MB = 10;
    const MAX_IMAGE_SIZE_MB = 3;

    // Handle audio files
    if (fileType === "audio") {
      // Check initial size
      const initialSizeMB = file.size / (1024 * 1024);

      if (initialSizeMB > MAX_AUDIO_SIZE_MB) {
        toast.error(
          `Audio file is ${initialSizeMB.toFixed(2)}MB. Maximum size is ${MAX_AUDIO_SIZE_MB}MB`,
        );
        return {
          success: false,
          error: `Audio file must be under ${MAX_AUDIO_SIZE_MB}MB. Current size: ${initialSizeMB.toFixed(2)}MB`,
        };
      }

      // Compress audio (handles format detection internally)
      try {
        processedFile = await compressAudio(file);
        const compressedSizeMB = processedFile.size / (1024 * 1024);

        // Verify compressed size is still within limit
        if (compressedSizeMB > MAX_AUDIO_SIZE_MB) {
          toast.error(
            `Audio file is too large even after compression (${compressedSizeMB.toFixed(2)}MB). Maximum is ${MAX_AUDIO_SIZE_MB}MB`,
          );
          return {
            success: false,
            error: `Audio must be under ${MAX_AUDIO_SIZE_MB}MB after compression`,
          };
        }
      } catch (compressionError) {
        toast.warning("Audio compression failed, using original file");
        // Continue with original file if compression fails
      }
    }

    // Handle image files
    if (fileType === "image") {
      // Check initial size
      const initialSizeMB = file.size / (1024 * 1024);

      if (initialSizeMB > MAX_IMAGE_SIZE_MB) {
        toast.error(
          `Image file is ${initialSizeMB.toFixed(2)}MB. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`,
        );
        return {
          success: false,
          error: `Image file must be under ${MAX_IMAGE_SIZE_MB}MB. Current size: ${initialSizeMB.toFixed(2)}MB`,
        };
      }

      // Compress image
      try {
        processedFile = await compressImage(file);
        const compressedSizeMB = processedFile.size / (1024 * 1024);

        // Verify compressed size is still within limit
        if (compressedSizeMB > MAX_IMAGE_SIZE_MB) {
          toast.error(
            `Image file is too large even after compression (${compressedSizeMB.toFixed(2)}MB). Maximum is ${MAX_IMAGE_SIZE_MB}MB`,
          );
          return {
            success: false,
            error: `Image must be under ${MAX_IMAGE_SIZE_MB}MB after compression`,
          };
        }
      } catch (compressionError) {
        toast.warning("Image compression failed, using original file");
        // Continue with original file if compression fails
      }
    }

    // Construct file path: {user_id}/{center_id}/{module_type}/{type}/{uuid}_{filename}
    const uniqueId = crypto.randomUUID();
    const sanitizedFileName = processedFile.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );
    const fileName = `${user.id}/${centerId}/${moduleType}/${fileType}/${uniqueId}_${sanitizedFileName}`;

    // Upload to Supabase storage with retry logic
    let uploadAttempts = 0;
    const MAX_UPLOAD_ATTEMPTS = 3;
    let uploadError: any = null;

    while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
      try {
        const { data, error } = await supabase.storage
          .from("media_files")
          .upload(fileName, processedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("media_files").getPublicUrl(data.path);

        return { success: true, url: publicUrl };
      } catch (err) {
        uploadAttempts++;
        uploadError = err;

        if (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * uploadAttempts),
          );
        }
      }
    }

    // All upload attempts failed
    throw uploadError;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : `Failed to upload ${fileType}`;
    toast.error(`Upload failed. Please check the file and try again.`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export const moduleHelpers = {
  saveModule: async (
    centerId: string,
    moduleType: ModuleType,
    moduleTitle: string,
    moduleTitles: Record<string, string>,
    readingSections?: ReadingSection[],
    listeningSections?: ListeningSection[],
    writingSections?: WritingSection[],
  ): Promise<{
    success: boolean;
    paperId?: string;
    moduleId?: string;
    error?: string;
  }> => {
    try {
      let sections:
        | ReadingSection[]
        | ListeningSection[]
        | WritingSection[]
        | undefined;
      const title =
        moduleTitle || moduleTitles[moduleType] || `${moduleType} Module`;

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
      } else if (moduleType === "writing" && writingSections) {
        const { writingHelpers } = await import("@/helpers/writing");
        sections = await writingHelpers.uploadImages(centerId, writingSections);
      }

      const result = await createModule({
        centerId,
        moduleType,
        title,
        sections: sections as
          | ReadingSection[]
          | ListeningSection[]
          | WritingSection[],
      });

      return result;
    } catch (err) {
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
    writingSections: WritingSection[],
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

      const uploadedWritingSections = await writingHelpers.uploadImages(
        centerId,
        writingSections,
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
      const hasWritingContent = uploadedWritingSections.some(
        (s) => s.renderBlocks.length > 0,
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
          sections: uploadedWritingSections,
          expandedSections: uploadedWritingSections.map((s) => s.id),
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

export const deleteModule = async (
  moduleId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Failed to delete module. Please try again.",
    };
  }
};
