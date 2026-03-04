import { useEffect, useState } from "react";
import {
  MoreVertical,
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
    readingModuleId?: string | null;
    listeningModuleId?: string | null;
    writingModuleId?: string | null;
    speakingModuleId?: string | null;
    readingModuleName?: string | null;
    listeningModuleName?: string | null;
    writingModuleName?: string | null;
    speakingModuleName?: string | null;
  };
  activeMenu: string | null;
  onMenuToggle: (paperId: string) => void;
  onMenuClose: () => void;
  formatDate: (dateString: string) => string;
  onCardClick: (paperId: string) => void;
  onEditClick: (paperId: string) => void;
  onDeleteClick: (paperId: string) => void;
}

export function PaperCard({
  paper,
  activeMenu,
  onMenuToggle,
  onMenuClose,
  formatDate,
  onCardClick,
  onEditClick,
  onDeleteClick,
}: PaperCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onCardClick(paper.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
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
            </div>
          </div>
        </div>

        {/* Actions — three-dot menu for Edit & Delete only */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle(paper.id);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>

          {activeMenu === paper.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClose();
                  onEditClick(paper.id);
                }}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 rounded-t-xl"
              >
                <Edit className="w-4 h-4" />
                Edit Paper
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClose();
                  onDeleteClick(paper.id);
                }}
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
