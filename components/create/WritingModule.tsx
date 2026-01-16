import { Plus, Trash2 } from "lucide-react";
import {
  RenderBlock,
  RenderBlockType,
  WritingTask,
} from "../../context/ModuleContext";

interface WritingModuleProps {
  tasks: WritingTask[];
  onUpdateTaskField: (
    taskId: number,
    field: keyof WritingTask,
    value: any
  ) => void;
  onAddRenderBlock: (taskId: number) => void;
  onUpdateRenderBlock: (
    taskId: number,
    blockIndex: number,
    block: RenderBlock
  ) => void;
  onDeleteRenderBlock: (taskId: number, blockIndex: number) => void;
}

export default function WritingModule({
  tasks,
  onUpdateTaskField,
  onAddRenderBlock,
  onUpdateRenderBlock,
  onDeleteRenderBlock,
}: WritingModuleProps) {
  const blockTypes: RenderBlockType[] = [
    "instruction",
    "text",
    "image",
    "box",
    "editor",
  ];

  return (
    <div className="space-y-8 pb-4">
      {tasks.map((task, index) => (
        <div key={task.id} className="border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Task {index + 1}
          </h3>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                  Task Title
                </label>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) =>
                    onUpdateTaskField(task.id, "title", e.target.value)
                  }
                  placeholder="Enter task title"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={task.durationRecommendation}
                    onChange={(e) =>
                      onUpdateTaskField(
                        task.id,
                        "durationRecommendation",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                    Minimum Words
                  </label>
                  <input
                    type="number"
                    value={task.wordCountMin}
                    onChange={(e) =>
                      onUpdateTaskField(
                        task.id,
                        "wordCountMin",
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 block">
                Render Blocks
              </label>
              <div className="space-y-3">
                {task.renderBlocks.map((block, index) => (
                  <div
                    key={`${task.id}-block-${index}`}
                    className="border border-slate-200 rounded-xl p-4 bg-white"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <select
                        value={block.type}
                        onChange={(e) =>
                          onUpdateRenderBlock(task.id, index, {
                            ...block,
                            type: e.target.value as RenderBlockType,
                          })
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        {blockTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => onDeleteRenderBlock(task.id, index)}
                        className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      value={block.content}
                      onChange={(e) =>
                        onUpdateRenderBlock(task.id, index, {
                          ...block,
                          content: e.target.value,
                        })
                      }
                      placeholder="Enter block content..."
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                    />

                    {block.type === "image" && (
                      <input
                        type="text"
                        value={block.alt || ""}
                        onChange={(e) =>
                          onUpdateRenderBlock(task.id, index, {
                            ...block,
                            alt: e.target.value,
                          })
                        }
                        placeholder="Image alt text..."
                        className="mt-2 w-full p-3 border border-slate-200 rounded-lg text-sm"
                      />
                    )}

                    {block.type === "editor" && (
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          value={block.label || ""}
                          onChange={(e) =>
                            onUpdateRenderBlock(task.id, index, {
                              ...block,
                              label: e.target.value,
                            })
                          }
                          placeholder="Editor label"
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={block.placeholder || ""}
                          onChange={(e) =>
                            onUpdateRenderBlock(task.id, index, {
                              ...block,
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Editor placeholder"
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={block.min_words || 0}
                          onChange={(e) =>
                            onUpdateRenderBlock(task.id, index, {
                              ...block,
                              min_words: Number(e.target.value),
                            })
                          }
                          placeholder="Minimum words"
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => onAddRenderBlock(task.id)}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Render Block
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
