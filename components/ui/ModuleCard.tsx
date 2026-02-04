import {
  MoreVertical,
  Eye,
  Trash2,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  FileText,
} from "lucide-react";

interface ModuleCardProps {
  module: {
    id: string;
    module_type: string;
    heading: string;
    created_at: string;
    subheading?: string;
  };
  activeMenu: string | null;
  onMenuToggle: (moduleId: string) => void;
  onViewModule: (moduleId: string, moduleType: string) => void;
  onDeleteModule: (moduleId: string, moduleName: string) => void;
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

export function ModuleCard({
  module,
  activeMenu,
  onMenuToggle,
  onViewModule,
  onDeleteModule,
  formatDate,
}: ModuleCardProps) {
  const normalizedType = normalizeType(module.module_type);

  return (
    <div className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-visible">
      {/* Top Decorative Line */}
      <div
        className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-slate-200 to-transparent ${getModuleColor(normalizedType).replace("text-", "bg-").split(" ")[0]}`}
      />

      <div className="py-2 px-4">
        {/* Header: Icon & Menu */}
        <div className="flex justify-between items-start mb-2 ">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-10 h-10 rounded-md flex items-center justify-center text-2xl shadow-sm ${getModuleColor(normalizedType).replace("border-", "bg-opacity-10 bg-")}`}
            >
              {getModuleIcon(normalizedType)}
            </div>

            <div className="flex-1">
              <h3 className="text-md font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {module.heading}
              </h3>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle(module.id);
              }}
              className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${activeMenu === module.id ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {activeMenu === module.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1">
                  <button
                    onClick={() => onViewModule(module.id, module.module_type)}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => onDeleteModule(module.id, module.heading)}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors rounded-b-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Module
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Badges & Metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            Created at: {formatDate(module.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
