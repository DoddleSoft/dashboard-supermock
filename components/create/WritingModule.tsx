import { Upload, FileText, Image as ImageIcon } from "lucide-react";

interface Task {
  id: number;
  heading: string;
  preHeading: string;
  subHeading: string;
  contentType: "text" | "image";
  textContent: string;
  imageFile: File | null;
}

interface WritingModuleProps {
  tasks: Task[];
  onUpdateTask: (taskId: number, field: keyof Task, value: any) => void;
}

export default function WritingModule({
  tasks,
  onUpdateTask,
}: WritingModuleProps) {
  const handleFileChange = (
    taskId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateTask(taskId, "imageFile", file);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      {tasks.map((task, index) => (
        <div key={task.id} className="border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Task {index + 1}
          </h3>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Side - Headings */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                  Pre-heading
                </label>
                <input
                  type="text"
                  value={task.preHeading}
                  onChange={(e) =>
                    onUpdateTask(task.id, "preHeading", e.target.value)
                  }
                  placeholder="Enter pre-heading"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                  Heading
                </label>
                <input
                  type="text"
                  value={task.heading}
                  onChange={(e) =>
                    onUpdateTask(task.id, "heading", e.target.value)
                  }
                  placeholder="Enter heading"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                  Sub-heading
                </label>
                <input
                  type="text"
                  value={task.subHeading}
                  onChange={(e) =>
                    onUpdateTask(task.id, "subHeading", e.target.value)
                  }
                  placeholder="Enter sub-heading"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Right Side - Content Type & Content */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                  Content Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateTask(task.id, "contentType", "text")}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      task.contentType === "text"
                        ? "bg-red-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:border-red-300"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Text
                  </button>
                  <button
                    onClick={() =>
                      onUpdateTask(task.id, "contentType", "image")
                    }
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      task.contentType === "image"
                        ? "bg-red-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:border-red-300"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </button>
                </div>
              </div>

              {task.contentType === "text" ? (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                    Task Prompt Text
                  </label>
                  <textarea
                    value={task.textContent}
                    onChange={(e) =>
                      onUpdateTask(task.id, "textContent", e.target.value)
                    }
                    placeholder="Enter the task prompt text..."
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                    Task Prompt Image
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-red-400 hover:bg-red-50/50 transition-colors">
                    <input
                      type="file"
                      id={`task-image-${task.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(task.id, e)}
                    />
                    <label
                      htmlFor={`task-image-${task.id}`}
                      className="cursor-pointer"
                    >
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      {task.imageFile ? (
                        <div>
                          <p className="text-slate-900 font-medium">
                            {task.imageFile.name}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {(task.imageFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-600 font-medium">
                            Choose Image
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            Upload task prompt image
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {task.imageFile && (
                    <button
                      onClick={() => onUpdateTask(task.id, "imageFile", null)}
                      className="w-full mt-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
