import {
  X,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  FileText,
  Calendar,
  Badge,
} from "lucide-react";

interface ViewPaperModalProps {
  paper: {
    id: string;
    title: string;
    modulesCount: number;
    paperType?: string | null;
    createdAt: string;
    isActive: boolean;
    moduleTypes: string[];
    readingModuleName?: string | null;
    listeningModuleName?: string | null;
    writingModuleName?: string | null;
    speakingModuleName?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const normalizeType = (type: string) =>
  type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

const getModuleIcon = (type: string) => {
  switch (type) {
    case "Reading":
      return <BookOpen className="w-5 h-5" />;
    case "Writing":
      return <PenTool className="w-5 h-5" />;
    case "Listening":
      return <Headphones className="w-5 h-5" />;
    case "Speaking":
      return <Mic className="w-5 h-5" />;
    case "Mixed":
      return <FileText className="w-5 h-5" />;
    default:
      return null;
  }
};

const getModuleColor = (type: string) => {
  switch (type) {
    case "Reading":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Writing":
      return "bg-green-50 text-green-700 border-green-200";
    case "Listening":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Speaking":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Mixed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export function ViewPaperModal({
  paper,
  isOpen,
  onClose,
}: ViewPaperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Paper Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Section */}
          <div>
            <label className="block text-sm text-slate-900 mb-2">
              Paper Title
            </label>
            <p className="text-base font-semibold text-slate-700">
              {paper.title}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-900 mb-2">
                Paper Type
              </label>
              <p className="text-base font-semibold text-slate-700">
                {paper.paperType || "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm text-slate-900 mb-2">
                Status
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  paper.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                <Badge className="w-3 h-3 mr-2" />
                {paper.isActive ? "Published" : "Draft"}
              </span>
            </div>
          </div>

          {/* Modules Info */}
          <div className="flex items-center gap-6">
            <label className="block text-md text-slate-900">
              Modules ({paper.modulesCount})
            </label>
            <div className="space-y-2">
              {paper.moduleTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paper.moduleTypes.map((type) => {
                    const normalizedType = normalizeType(type);
                    return (
                      <span
                        key={type}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getModuleColor(normalizedType)}`}
                      >
                        {getModuleIcon(normalizedType)}
                        {normalizedType}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No modules added yet</p>
              )}
            </div>
          </div>

          {/* Module Names */}
          <div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reading</span>
                <span>{paper.readingModuleName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Listening</span>
                <span>{paper.listeningModuleName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Writing</span>
                <span>{paper.writingModuleName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Speaking</span>
                <span>{paper.speakingModuleName || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Created Date
            </label>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-red-400 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
