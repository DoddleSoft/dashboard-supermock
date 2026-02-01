import {
  ListeningSection,
  RenderBlock,
  QuestionDefinition,
} from "@/context/ModuleContext";
import { uploadMediaFile } from "@/helpers/modules";
import { toast } from "sonner";

interface ListeningModuleData {
  sections: ListeningSection[];
  expandedSections: string[];
}

export const listeningHelpers = {
  addSection: (
    data: ListeningModuleData,
    generateId: () => string,
  ): ListeningModuleData => {
    const newSection: ListeningSection = {
      id: generateId(),
      title: `Section ${data.sections.length + 1}`,
      instruction: "",
      audioPath: "",
      audioFile: null,
      renderBlocks: [],
      questions: {},
    };

    return {
      sections: [...data.sections, newSection],
      expandedSections: [...data.expandedSections, newSection.id],
    };
  },

  updateSectionTitle: (
    data: ListeningModuleData,
    sectionId: string,
    title: string,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    };
  },

  updateSectionInstruction: (
    data: ListeningModuleData,
    sectionId: string,
    instruction: string,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, instruction } : section,
      ),
    };
  },

  updateSectionAudioPath: (
    data: ListeningModuleData,
    sectionId: string,
    path: string,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, audioPath: path } : section,
      ),
    };
  },

  updateSectionAudio: (
    data: ListeningModuleData,
    sectionId: string,
    file: File | null,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, audioFile: file } : section,
      ),
    };
  },

  addRenderBlock: (
    data: ListeningModuleData,
    sectionId: string,
    block: RenderBlock,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? { ...section, renderBlocks: [...section.renderBlocks, block] }
          : section,
      ),
    };
  },

  updateRenderBlock: (
    data: ListeningModuleData,
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              renderBlocks: section.renderBlocks.map((b, idx) =>
                idx === blockIndex ? block : b,
              ),
            }
          : section,
      ),
    };
  },

  deleteRenderBlock: (
    data: ListeningModuleData,
    sectionId: string,
    blockIndex: number,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              renderBlocks: section.renderBlocks.filter(
                (_, idx) => idx !== blockIndex,
              ),
            }
          : section,
      ),
    };
  },

  updateQuestion: (
    data: ListeningModuleData,
    sectionId: string,
    questionRef: string,
    questionData: QuestionDefinition,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: {
                ...section.questions,
                [questionRef]: questionData,
              },
            }
          : section,
      ),
    };
  },

  deleteQuestion: (
    data: ListeningModuleData,
    sectionId: string,
    questionRef: string,
  ): ListeningModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const { [questionRef]: _, ...rest } = section.questions;
        return { ...section, questions: rest };
      }),
    };
  },

  updateQuestionRef: (
    data: ListeningModuleData,
    sectionId: string,
    fromRef: string,
    toRef: string,
  ): ListeningModuleData => {
    if (!toRef || toRef === fromRef) return data;

    return {
      ...data,
      sections: data.sections.map((section) => {
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
    };
  },

  toggleSection: (
    data: ListeningModuleData,
    sectionId: string,
  ): ListeningModuleData => {
    return {
      ...data,
      expandedSections: data.expandedSections.includes(sectionId)
        ? data.expandedSections.filter((id) => id !== sectionId)
        : [...data.expandedSections, sectionId],
    };
  },

  deleteSection: (
    data: ListeningModuleData,
    sectionId: string,
  ): ListeningModuleData => {
    return {
      sections: data.sections.filter((section) => section.id !== sectionId),
      expandedSections: data.expandedSections.filter((id) => id !== sectionId),
    };
  },

  uploadAudioFiles: async (
    centerId: string,
    sections: ListeningSection[],
  ): Promise<ListeningSection[]> => {
    const updatedSections: ListeningSection[] = [];
    let uploadFailures = 0;

    for (const section of sections) {
      if (section.audioFile) {
        try {
          console.log(`Uploading audio for section: ${section.title}`);
          const result = await uploadMediaFile(
            centerId,
            "listening",
            section.audioFile,
            "audio",
          );

          if (result.success && result.url) {
            console.log(
              `✓ Audio uploaded successfully for section: ${section.title}`,
            );
            updatedSections.push({
              ...section,
              audioPath: result.url,
              audioFile: null,
            });
          } else {
            // Upload failed - throw error to prevent database insertion without audio
            uploadFailures++;
            const errorMsg = result.error || "Unknown upload error";
            console.error(
              `✗ Audio upload failed for section "${section.title}":`,
              errorMsg,
            );
            toast.error(
              `Failed to upload audio for "${section.title}": ${errorMsg}`,
            );
            throw new Error(
              `Audio upload failed for section "${section.title}": ${errorMsg}`,
            );
          }
        } catch (error) {
          // Re-throw to prevent module creation without audio
          const errorMsg =
            error instanceof Error ? error.message : "Audio upload failed";
          console.error(
            `Error uploading audio for section "${section.title}":`,
            error,
          );
          throw new Error(errorMsg);
        }
      } else {
        // No audio file to upload, keep section as is
        updatedSections.push(section);
      }
    }

    if (uploadFailures > 0) {
      throw new Error(
        `Failed to upload ${uploadFailures} audio file(s). Please check file sizes and try again.`,
      );
    }

    return updatedSections;
  },

  /**
   * Process and upload image files in render blocks for listening sections
   */
  uploadImages: async (
    centerId: string,
    sections: ListeningSection[],
  ): Promise<ListeningSection[]> => {
    const updatedSections: ListeningSection[] = [];
    let uploadFailures = 0;

    for (const section of sections) {
      const updatedBlocks: RenderBlock[] = [];

      for (const block of section.renderBlocks) {
        if (block.type === "image" && block.content) {
          // Check if content is a base64 data URL
          if (block.content.startsWith("data:image/")) {
            try {
              console.log(`Processing image in section: ${section.title}`);

              // Convert base64 to File
              const response = await fetch(block.content);
              const blob = await response.blob();
              const file = new File(
                [blob],
                `image_${Date.now()}.${blob.type.split("/")[1] || "jpg"}`,
                { type: blob.type },
              );

              // Upload to storage (with compression and validation)
              const result = await uploadMediaFile(
                centerId,
                "listening",
                file,
                "image",
              );

              if (result.success && result.url) {
                console.log(
                  `✓ Image uploaded successfully in section: ${section.title}`,
                );
                updatedBlocks.push({
                  ...block,
                  content: result.url,
                });
              } else {
                // Upload failed - throw error to prevent database insertion without image
                uploadFailures++;
                const errorMsg = result.error || "Unknown upload error";
                console.error(
                  `✗ Image upload failed in section "${section.title}":`,
                  errorMsg,
                );
                toast.error(
                  `Failed to upload image in "${section.title}": ${errorMsg}`,
                );
                throw new Error(
                  `Image upload failed in section "${section.title}": ${errorMsg}`,
                );
              }
            } catch (error) {
              // Re-throw to prevent module creation without image
              const errorMsg =
                error instanceof Error ? error.message : "Image upload failed";
              console.error(
                `Error processing image in section "${section.title}":`,
                error,
              );
              throw new Error(errorMsg);
            }
          } else {
            // Already a URL or external path
            updatedBlocks.push(block);
          }
        } else {
          updatedBlocks.push(block);
        }
      }

      updatedSections.push({
        ...section,
        renderBlocks: updatedBlocks,
      });
    }

    if (uploadFailures > 0) {
      throw new Error(
        `Failed to upload ${uploadFailures} image(s). Please check file sizes and try again.`,
      );
    }

    return updatedSections;
  },
};
