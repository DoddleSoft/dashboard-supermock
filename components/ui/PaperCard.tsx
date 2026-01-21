import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
} from "lucide-react";

interface PaperCardProps {
  paper: {
    id: string;
    title: string;
    modulesCount: number;
    paperType?: string | null;
    createdAt: string;
    isActive: boolean;
    moduleTypes: string[];
  };
  activeMenu: string | null;
  onMenuToggle: (paperId: string) => void;
  onMenuClose: () => void;
  formatDate: (dateString: string) => string;
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
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "Writing":
      return "bg-green-100 text-green-600 border-green-200";
    case "Listening":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "Speaking":
      return "bg-orange-100 text-orange-600 border-orange-200";
    case "Mixed":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export function PaperCard({
  paper,
  activeMenu,
  onMenuToggle,
  onMenuClose,
  formatDate,
}: PaperCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {paper.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-700">
                  {paper.modulesCount}
                </span>{" "}
                Modules
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-700">
                  {paper.paperType || "N/A"}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-700">
                  {formatDate(paper.createdAt)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  paper.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {paper.isActive ? "Published" : "Draft"}
              </span>
              {paper.moduleTypes.map((type) => {
                const normalizedType = normalizeType(type);
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getModuleColor(normalizedType)}`}
                  >
                    {getModuleIcon(normalizedType)}
                    {normalizedType}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => onMenuToggle(paper.id)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>

          {activeMenu === paper.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10">
              <button className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 rounded-t-xl">
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <Edit className="w-4 h-4" />
                Edit Paper
              </button>
              <button
                onClick={onMenuClose}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 rounded-b-xl"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
