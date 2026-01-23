import { useEffect, useState } from "react";
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
import { ViewPaperModal } from "./ViewPaperModal";
import { EditPaperModal } from "./EditPaperModal";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";

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
  availableModules: {
    id: string;
    module_type: string;
    heading: string;
    subheading?: string;
  }[];
  onPaperUpdate?: (
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
  onPaperDelete?: (paperId: string) => Promise<void>;
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

const getModuleNameById = (
  modules: {
    id: string;
    module_type: string;
    heading: string;
    subheading?: string;
  }[],
  moduleId?: string | null,
) => {
  if (!moduleId) return null;
  return modules.find((m) => m.id === moduleId)?.heading ?? null;
};

export function PaperCard({
  paper,
  activeMenu,
  onMenuToggle,
  onMenuClose,
  formatDate,
  availableModules,
  onPaperUpdate,
  onPaperDelete,
}: PaperCardProps) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (activeMenu !== paper.id) {
      setShowDeleteConfirm(false);
    }
  }, [activeMenu, paper.id]);

  const handleViewDetails = () => {
    setShowViewModal(true);
    setShowDeleteConfirm(false);
    onMenuClose();
  };

  const handleEditPaper = () => {
    setShowEditModal(true);
    setShowDeleteConfirm(false);
    onMenuClose();
  };

  const handleDeletePaper = async () => {
    if (!onPaperDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onPaperDelete(paper.id);
    } catch (error) {
      console.error("Failed to delete paper:", error);
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
    if (!onPaperUpdate) {
      return { success: false, error: "Update handler not provided" };
    }

    try {
      const result = await onPaperUpdate(paper.id, data);
      return result;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update paper",
      };
    }
  };
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
              <button
                onClick={handleViewDetails}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 rounded-t-xl"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={handleEditPaper}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
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

      {/* Modals */}
      <ViewPaperModal
        paper={{
          ...paper,
          readingModuleName:
            paper.readingModuleName ??
            getModuleNameById(availableModules, paper.readingModuleId),
          listeningModuleName:
            paper.listeningModuleName ??
            getModuleNameById(availableModules, paper.listeningModuleId),
          writingModuleName:
            paper.writingModuleName ??
            getModuleNameById(availableModules, paper.writingModuleId),
          speakingModuleName:
            paper.speakingModuleName ??
            getModuleNameById(availableModules, paper.speakingModuleId),
        }}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
      />
      <EditPaperModal
        paper={paper}
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
