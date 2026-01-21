import Link from "next/link";
import {
  X,
  Check,
  ChevronDown,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
} from "lucide-react";

interface Module {
  id: string;
  module_type: string;
  heading: string;
  subheading?: string;
}

interface CreatePaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  setPaperTitle: (title: string) => void;
  paperType: "IELTS" | "OIETC" | "GRE";
  setPaperType: (type: "IELTS" | "OIETC" | "GRE") => void;
  availableModules: Module[];
  selectedModules: {
    reading?: string;
    listening?: string;
    writing?: string;
    speaking?: string;
  };
  setSelectedModules: React.Dispatch<
    React.SetStateAction<{
      reading?: string;
      listening?: string;
      writing?: string;
      speaking?: string;
    }>
  >;
  showModuleDropdown: string | null;
  setShowModuleDropdown: (type: string | null) => void;
  creatingPaper: boolean;
  onCreatePaper: () => void;
  slug: string;
}

const getModuleIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "reading":
      return <BookOpen className="w-4 h-4" />;
    case "listening":
      return <Headphones className="w-4 h-4" />;
    case "writing":
      return <PenTool className="w-4 h-4" />;
    case "speaking":
      return <Mic className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const getModuleColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "reading":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "listening":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "writing":
      return "bg-green-100 text-green-600 border-green-200";
    case "speaking":
      return "bg-orange-100 text-orange-600 border-orange-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const formatModuleType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export function CreatePaperModal({
  isOpen,
  onClose,
  paperTitle,
  setPaperTitle,
  paperType,
  setPaperType,
  availableModules,
  selectedModules,
  setSelectedModules,
  showModuleDropdown,
  setShowModuleDropdown,
  creatingPaper,
  onCreatePaper,
  slug,
}: CreatePaperModalProps) {
  if (!isOpen) return null;

  const getModulesByType = (type: string) => {
    return availableModules.filter((m) => m.module_type === type);
  };

  const getSelectedModule = (type: string) => {
    const moduleId = selectedModules[type as keyof typeof selectedModules];
    return availableModules.find((m) => m.id === moduleId);
  };

  const handleClose = () => {
    onClose();
    setPaperTitle("");
    setSelectedModules({});
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Create Test Paper
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Select modules to create a complete test paper
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Paper Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Paper Title *
            </label>
            <input
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              placeholder="e.g., IELTS Academic Test 01"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Paper Type */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Paper Type *
            </label>
            <select
              value={paperType}
              onChange={(e) =>
                setPaperType(e.target.value as "IELTS" | "OIETC" | "GRE")
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
            >
              <option value="IELTS">IELTS</option>
              <option value="OIETC">OIETC</option>
              <option value="GRE">GRE</option>
            </select>
          </div>

          {/* Module Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-4">
              Select Modules (Select at least one)
            </label>
            <div className="space-y-4">
              {["reading", "listening", "writing", "speaking"].map(
                (moduleType) => {
                  const modulesOfType = getModulesByType(moduleType);
                  const selected = getSelectedModule(moduleType);

                  return (
                    <div key={moduleType}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${getModuleColor(
                              moduleType,
                            )}`}
                          >
                            {getModuleIcon(moduleType)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {formatModuleType(moduleType)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {modulesOfType.length} available
                        </span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowModuleDropdown(
                              showModuleDropdown === moduleType
                                ? null
                                : moduleType,
                            )
                          }
                          disabled={modulesOfType.length === 0}
                          className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span
                            className={
                              selected ? "text-slate-900" : "text-slate-400"
                            }
                          >
                            {selected
                              ? selected.heading
                              : modulesOfType.length === 0
                                ? "No modules available"
                                : "Choose a module..."}
                          </span>
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        </button>

                        {showModuleDropdown === moduleType &&
                          modulesOfType.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                              {modulesOfType.map((module) => (
                                <button
                                  key={module.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModules((prev) => ({
                                      ...prev,
                                      [moduleType]: module.id,
                                    }));
                                    setShowModuleDropdown(null);
                                  }}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {module.heading}
                                    </p>
                                    {module.subheading && (
                                      <p className="text-xs text-slate-500">
                                        {module.subheading}
                                      </p>
                                    )}
                                  </div>
                                  {selected?.id === module.id && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {availableModules.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-900 text-sm mb-2">
                No standalone modules available
              </p>
              <Link
                href={`/dashboard/${slug}/questions`}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
                onClick={handleClose}
              >
                Create modules first
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleClose}
              disabled={creatingPaper}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onCreatePaper}
              disabled={creatingPaper}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              {creatingPaper ? "Creating..." : "Create Paper"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
