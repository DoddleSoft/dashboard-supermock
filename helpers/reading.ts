import {
  ReadingSection,
  RenderBlock,
  QuestionDefinition,
} from "@/context/ModuleContext";
import { uploadMediaFile } from "@/helpers/modules";
import { toast } from "sonner";

interface ReadingModuleData {
  sections: ReadingSection[];
  expandedSections: string[];
}

export const readingHelpers = {
  addSection: (
    data: ReadingModuleData,
    generateId: () => string,
  ): ReadingModuleData => {
    const newSection: ReadingSection = {
      id: generateId(),
      title: `Passage ${data.sections.length + 1}`,
      heading: "",
      instruction: "",
      passageText: "",
      renderBlocks: [],
      questions: {},
    };

    return {
      sections: [...data.sections, newSection],
      expandedSections: [...data.expandedSections, newSection.id],
    };
  },

  updateSectionTitle: (
    data: ReadingModuleData,
    sectionId: string,
    title: string,
  ): ReadingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    };
  },

  updateSectionHeading: (
    data: ReadingModuleData,
    sectionId: string,
    heading: string,
  ): ReadingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, heading } : section,
      ),
    };
  },

  updateSectionInstruction: (
    data: ReadingModuleData,
    sectionId: string,
    instruction: string,
  ): ReadingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, instruction } : section,
      ),
    };
  },

  updateSectionPassageText: (
    data: ReadingModuleData,
    sectionId: string,
    content: string,
  ): ReadingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId
          ? { ...section, passageText: content }
          : section,
      ),
    };
  },

  addRenderBlock: (
    data: ReadingModuleData,
    sectionId: string,
    block: RenderBlock,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
    blockIndex: number,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
    questionRef: string,
    questionData: QuestionDefinition,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
    questionRef: string,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
    fromRef: string,
    toRef: string,
  ): ReadingModuleData => {
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
    data: ReadingModuleData,
    sectionId: string,
  ): ReadingModuleData => {
    return {
      ...data,
      expandedSections: data.expandedSections.includes(sectionId)
        ? data.expandedSections.filter((id) => id !== sectionId)
        : [...data.expandedSections, sectionId],
    };
  },

  deleteSection: (
    data: ReadingModuleData,
    sectionId: string,
  ): ReadingModuleData => {
    return {
      sections: data.sections.filter((section) => section.id !== sectionId),
      expandedSections: data.expandedSections.filter((id) => id !== sectionId),
    };
  },

  /**
   * Process and upload image files in render blocks
   * Converts base64 images to uploaded files and updates URLs
   */
  uploadImages: async (
    centerId: string,
    sections: ReadingSection[],
  ): Promise<ReadingSection[]> => {
    const updatedSections: ReadingSection[] = [];
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
                "reading",
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
