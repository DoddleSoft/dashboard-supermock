import { WritingTask, RenderBlock } from "@/context/ModuleContext";
import { uploadMediaFile } from "@/helpers/modules";

interface WritingModuleData {
  tasks: WritingTask[];
}

export const writingHelpers = {
  updateTaskField: (
    data: WritingModuleData,
    taskId: number,
    field: keyof WritingTask,
    value: any,
  ): WritingModuleData => {
    return {
      tasks: data.tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task,
      ),
    };
  },

  addRenderBlock: (
    data: WritingModuleData,
    taskId: number,
    block: RenderBlock,
  ): WritingModuleData => {
    return {
      tasks: data.tasks.map((task) =>
        task.id === taskId
          ? { ...task, renderBlocks: [...task.renderBlocks, block] }
          : task,
      ),
    };
  },

  updateRenderBlock: (
    data: WritingModuleData,
    taskId: number,
    blockIndex: number,
    block: RenderBlock,
  ): WritingModuleData => {
    return {
      tasks: data.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              renderBlocks: task.renderBlocks.map((b, idx) =>
                idx === blockIndex ? block : b,
              ),
            }
          : task,
      ),
    };
  },

  deleteRenderBlock: (
    data: WritingModuleData,
    taskId: number,
    blockIndex: number,
  ): WritingModuleData => {
    return {
      tasks: data.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              renderBlocks: task.renderBlocks.filter(
                (_, idx) => idx !== blockIndex,
              ),
            }
          : task,
      ),
    };
  },

  /**
   * Process and upload image files in render blocks for writing tasks
   */
  uploadImages: async (
    centerId: string,
    tasks: WritingTask[],
  ): Promise<WritingTask[]> => {
    const updatedTasks: WritingTask[] = [];

    for (const task of tasks) {
      const updatedBlocks: RenderBlock[] = [];

      for (const block of task.renderBlocks) {
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

      updatedTasks.push({
        ...task,
        renderBlocks: updatedBlocks,
      });
    }

    return updatedTasks;
  },
};
