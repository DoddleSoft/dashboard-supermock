import { BookOpen, Headphones, PenTool, Mic } from "lucide-react";

interface PaperModule {
  heading: string;
}

interface PaperCardWithModulesProps {
  paper: {
    id: string;
    title: string;
    paper_type: string;
    is_active: boolean;
    reading_module?: PaperModule | null;
    listening_module?: PaperModule | null;
    writing_module?: PaperModule | null;
    speaking_module?: PaperModule | null;
    tests_conducted: number;
  };
}

export function PaperCardWithModules({ paper }: PaperCardWithModulesProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {paper.title}
          </h3>
          <p className="text-sm text-slate-500">{paper.paper_type}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            paper.is_active
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {paper.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Modules */}
      <div className="space-y-2 mb-4">
        {paper.reading_module && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3 h-3" />
            </div>
            <span className="truncate">{paper.reading_module.heading}</span>
          </div>
        )}
        {paper.listening_module && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-3 h-3" />
            </div>
            <span className="truncate">{paper.listening_module.heading}</span>
          </div>
        )}
        {paper.writing_module && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
              <PenTool className="w-3 h-3" />
            </div>
            <span className="truncate">{paper.writing_module.heading}</span>
          </div>
        )}
        {paper.speaking_module && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
              <Mic className="w-3 h-3" />
            </div>
            <span className="truncate">{paper.speaking_module.heading}</span>
          </div>
        )}
      </div>

      {/* Tests Conducted */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {paper.tests_conducted} test
          {paper.tests_conducted !== 1 ? "s" : ""} conducted
        </p>
      </div>
    </div>
  );
}
