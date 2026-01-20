import { WritingSection, RenderBlock } from "@/context/ModuleContext";
import { uploadMediaFile } from "@/helpers/modules";

interface WritingModuleData {
  sections: WritingSection[];
  expandedSections: string[];
}

export const writingHelpers = {
  addSection: (
    data: WritingModuleData,
    generateId: () => string,
  ): WritingModuleData => {
    const newSection: WritingSection = {
      id: generateId(),
      heading: `Writing Task ${data.sections.length + 1}`,
      subheading: "",
      renderBlocks: [],
    };

    return {
      sections: [...data.sections, newSection],
      expandedSections: [...data.expandedSections, newSection.id],
    };
  },

  updateSectionHeading: (
    data: WritingModuleData,
    sectionId: string,
    heading: string,
  ): WritingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, heading } : section,
      ),
    };
  },

  updateSectionSubheading: (
    data: WritingModuleData,
    sectionId: string,
    subheading: string,
  ): WritingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, subheading } : section,
      ),
    };
  },

  updateSectionInstruction: (
    data: WritingModuleData,
    sectionId: string,
    instruction: string,
  ): WritingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, instruction } : section,
      ),
    };
  },

  updateSectionTime: (
    data: WritingModuleData,
    sectionId: string,
    timeMinutes: number,
  ): WritingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, timeMinutes } : section,
      ),
    };
  },

  updateSectionMinWords: (
    data: WritingModuleData,
    sectionId: string,
    minWords: number,
  ): WritingModuleData => {
    return {
      ...data,
      sections: data.sections.map((section) =>
        section.id === sectionId ? { ...section, minWords } : section,
      ),
    };
  },

  addRenderBlock: (
    data: WritingModuleData,
    sectionId: string,
    block: RenderBlock,
  ): WritingModuleData => {
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
    data: WritingModuleData,
    sectionId: string,
    blockIndex: number,
    block: RenderBlock,
  ): WritingModuleData => {
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
    data: WritingModuleData,
    sectionId: string,
    blockIndex: number,
  ): WritingModuleData => {
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

  toggleSection: (
    data: WritingModuleData,
    sectionId: string,
  ): WritingModuleData => {
    return {
      ...data,
      expandedSections: data.expandedSections.includes(sectionId)
        ? data.expandedSections.filter((id) => id !== sectionId)
        : [...data.expandedSections, sectionId],
    };
  },

  deleteSection: (
    data: WritingModuleData,
    sectionId: string,
  ): WritingModuleData => {
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
    sections: WritingSection[],
  ): Promise<WritingSection[]> => {
    const updatedSections: WritingSection[] = [];

    for (const section of sections) {
      const updatedBlocks: RenderBlock[] = [];

      for (const block of section.renderBlocks) {
        if (block.type === "image" && block.content) {
          // Check if content is a base64 data URL
          if (block.content.startsWith("data:image/")) {
            try {
              // Convert base64 to File
              const response = await fetch(block.content);
              const blob = await response.blob();
              const file = new File(
                [blob],
                `image_${Date.now()}.${blob.type.split("/")[1]}`,
                { type: blob.type },
              );

              // Upload to storage
              const result = await uploadMediaFile(
                centerId,
                "writing",
                file,
                "image",
              );

              if (result.success && result.url) {
                updatedBlocks.push({
                  ...block,
                  content: result.url,
                });
              } else {
                // Keep original if upload fails
                updatedBlocks.push(block);
              }
            } catch (error) {
              console.error("Error processing image:", error);
              updatedBlocks.push(block);
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

    return updatedSections;
  },
};
