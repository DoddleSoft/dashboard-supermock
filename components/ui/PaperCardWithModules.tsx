import { useEffect, useState } from "react";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EditPaperModal } from "./EditPaperModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import type { Module, Paper } from "@/helpers/papers";

interface PaperCardWithModulesProps {
  paper: Paper;
  activeMenu: string | null;
  onMenuToggle: (paperId: string) => void;
  onMenuClose: () => void;
  availableModules: Module[];
  onPaperUpdate: (
    paperId: string,
    data: {
      title: string;
      paperType: string;
      isActive: boolean;
      readingModuleId?: string | null;
      listeningModuleId?: string | null;
      writingModuleId?: string | null;
      speakingModuleId?: string | null;
    },
  ) => Promise<{ success: boolean; error?: string }>;
  onPaperDelete: (paperId: string) => Promise<void>;
}

export function PaperCardWithModules({
  paper,
  activeMenu,
  onMenuToggle,
  onMenuClose,
  availableModules,
  onPaperUpdate,
  onPaperDelete,
}: PaperCardWithModulesProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (activeMenu !== paper.id) {
      setShowDeleteConfirm(false);
    }
  }, [activeMenu, paper.id]);

  const handleEditPaper = () => {
    setShowEditModal(true);
    setShowDeleteConfirm(false);
    onMenuClose();
  };

  const handleDeletePaper = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onPaperDelete(paper.id);
    } catch (error) {
      console.error("Failed to delete paper:", error);
      toast.error("Failed to delete the paper. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onMenuClose();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleSavePaper = async (data: {
    title: string;
    paperType: string;
    isActive: boolean;
    readingModuleId?: string | null;
    listeningModuleId?: string | null;
    writingModuleId?: string | null;
    speakingModuleId?: string | null;
  }) => {
    try {
      return await onPaperUpdate(paper.id, data);
    } catch (error) {
      return {
        success: false,
        error: "Failed to update paper. Please try again.",
      };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {paper.title}
          </h3>
          <p className="text-sm text-slate-500">{paper.paper_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              paper.is_active
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {paper.is_active ? "Active" : "Inactive"}
          </span>
          <div className="relative">
            <button
              onClick={() => onMenuToggle(paper.id)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>

            {activeMenu === paper.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10">
                <button
                  onClick={handleEditPaper}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 rounded-t-xl"
                >
                  <Edit className="w-4 h-4" />
                  Edit Paper
                </button>
                <button
                  onClick={handleDeleteClick}
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

      <EditPaperModal
        paper={{
          id: paper.id,
          title: paper.title,
          paperType: paper.paper_type,
          isActive: paper.is_active,
          readingModuleId:
            paper.reading_module?.id ?? paper.reading_module_id ?? null,
          listeningModuleId:
            paper.listening_module?.id ?? paper.listening_module_id ?? null,
          writingModuleId:
            paper.writing_module?.id ?? paper.writing_module_id ?? null,
          speakingModuleId:
            paper.speaking_module?.id ?? paper.speaking_module_id ?? null,
        }}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        availableModules={availableModules}
        onSave={handleSavePaper}
      />
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Paper"
        description="This action will permanently remove the paper."
        itemName={paper.title}
        isDeleting={isDeleting}
        onConfirm={handleDeletePaper}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
