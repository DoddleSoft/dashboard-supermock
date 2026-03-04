"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, FileText, Package, BookOpen } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useModuleContext } from "../../../../context/ModuleContext";
import { useCentre } from "../../../../context/CentreContext";
import { SmallLoader } from "../../../../components/ui/SmallLoader";
import { CreateModuleModal } from "../../../../components/questions/CreateModuleModal";
import { DeleteModuleDialog } from "../../../../components/questions/DeleteModuleDialog";
import { ViewPaperModal } from "../../../../components/ui/ViewPaperModal";
import { EditPaperModal } from "../../../../components/ui/EditPaperModal";
import { DeleteConfirmationDialog } from "../../../../components/ui/DeleteConfirmationDialog";
import { PaperCard } from "../../../../components/ui/PaperCard";
import { ModuleCard } from "../../../../components/ui/ModuleCard";
import {
  deletePaper,
  updatePaper,
  fetchCenterModules,
  Module,
} from "../../../../helpers/papers";
import { deleteModule } from "../../../../helpers/modules";
import { formatDateShort } from "../../../../lib/utils";

const formatDate = formatDateShort;

export default function PapersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [standaloneModules, setStandaloneModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "papers" | "modules">(
    "all",
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    moduleId: string | null;
    moduleName: string | null;
  }>({
    open: false,
    moduleId: null,
    moduleName: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Paper modal state
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [showPaperViewModal, setShowPaperViewModal] = useState(false);
  const [showPaperEditModal, setShowPaperEditModal] = useState(false);
  const [showPaperDeleteDialog, setShowPaperDeleteDialog] = useState(false);
  const [isPaperDeleting, setIsPaperDeleting] = useState(false);

  const { centerPapers, centerModulesLoading, refreshCenterModules } =
    useModuleContext();
  const { currentCenter } = useCentre();

  const refreshLocalModules = useCallback(async () => {
    if (!currentCenter?.center_id) return;

    setModulesLoading(true);
    const data = await fetchCenterModules(currentCenter.center_id);
    setAllModules(data);
    setStandaloneModules(data.filter((module) => !module.paper_id));
    setModulesLoading(false);
  }, [currentCenter?.center_id]);

  useEffect(() => {
    if (currentCenter?.center_id) {
      refreshLocalModules();
    }
  }, [currentCenter?.center_id, refreshLocalModules]);

  const handleUpdatePaper = async (
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
  ) => {
    const result = await updatePaper(paperId, {
      title: data.title,
      paperType: data.paperType as "IELTS" | "OIETC" | "GRE",
      readingModuleId: data.readingModuleId || undefined,
      listeningModuleId: data.listeningModuleId || undefined,
      writingModuleId: data.writingModuleId || undefined,
      speakingModuleId: data.speakingModuleId || undefined,
      instruction: undefined,
    });

    if (result.success) {
      await Promise.all([refreshCenterModules(), refreshLocalModules()]);
    }

    return result;
  };

  const handleDeletePaper = async (paperId: string) => {
    const result = await deletePaper(paperId);
    if (result.success) {
      await Promise.all([refreshCenterModules(), refreshLocalModules()]);
    }
  };

  const handleConfirmDeletePaper = async () => {
    if (!selectedPaperId) return;
    setIsPaperDeleting(true);
    try {
      await handleDeletePaper(selectedPaperId);
    } catch (error) {
      console.error("Failed to delete paper:", error);
      toast.error("Failed to delete the paper. Please try again.");
    } finally {
      setIsPaperDeleting(false);
      setShowPaperDeleteDialog(false);
      setSelectedPaperId(null);
      setActiveMenu(null);
    }
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
    if (!selectedPaperId) {
      return { success: false, error: "No paper selected" };
    }
    try {
      const result = await handleUpdatePaper(selectedPaperId, data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: "Failed to update paper. Please try again.",
      };
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteConfirm.moduleId) return;

    setIsDeleting(true);
    const result = await deleteModule(deleteConfirm.moduleId);
    setIsDeleting(false);

    if (result.success) {
      setStandaloneModules(
        standaloneModules.filter((m) => m.id !== deleteConfirm.moduleId),
      );
      setDeleteConfirm({ open: false, moduleId: null, moduleName: null });
      setActiveMenu(null);
    } else {
      toast.error(result.error || "Failed to delete module. Please try again.");
    }
  };

  const handleViewModule = (moduleId: string, moduleType: string) => {
    router.push(
      `/dashboard/${slug}/questions/preview?type=${moduleType.toLowerCase()}&moduleId=${moduleId}`,
    );
    setActiveMenu(null);
  };

  const filteredPapers = useMemo(
    () =>
      centerPapers.filter((paper) => {
        const matchesSearch = paper.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesFilter =
          filterType === "all" ||
          paper.moduleTypes.map((t) => t.toLowerCase()).includes(filterType);
        return matchesSearch && matchesFilter;
      }),
    [centerPapers, searchQuery, filterType],
  );

  const filteredModules = useMemo(
    () =>
      standaloneModules.filter((module) => {
        const matchesSearch = module.heading
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesFilter =
          filterType === "all" ||
          module.module_type.toLowerCase() === filterType;
        return matchesSearch && matchesFilter;
      }),
    [standaloneModules, searchQuery, filterType],
  );

  const totalItems = filteredPapers.length + filteredModules.length;

  const visibleItems = useMemo(() => {
    if (activeView === "papers") return filteredPapers.length;
    if (activeView === "modules") return filteredModules.length;
    return totalItems;
  }, [activeView, filteredPapers.length, filteredModules.length, totalItems]);

  const selectedPaper = useMemo(
    () => centerPapers.find((p) => p.id === selectedPaperId) ?? null,
    [centerPapers, selectedPaperId],
  );

  const getModuleNameById = (moduleId?: string | null) => {
    if (!moduleId) return null;
    return allModules.find((m) => m.id === moduleId)?.heading ?? null;
  };

  // Show single loading state while data is loading
  if (centerModulesLoading || modulesLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading papers and modules..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center w-180 gap-3 flex-1">
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
          >
            <option value="all">All Types</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="listening">Listening</option>
            <option value="speaking">Speaking</option>
          </select>

          {/* Header with View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setActiveView("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "all"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({totalItems})
              </button>
              <button
                onClick={() => setActiveView("papers")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "papers"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Papers ({filteredPapers.length})
              </button>
              <button
                onClick={() => setActiveView("modules")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "modules"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Modules ({filteredModules.length})
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModuleModal(true)}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Module
        </button>
      </div>

      {/* Papers Grid */}
      {(activeView === "all" || activeView === "papers") &&
        filteredPapers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Test Papers
              </h2>
              <span className="text-sm text-slate-500">
                ({filteredPapers.length})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {filteredPapers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  activeMenu={activeMenu}
                  onMenuToggle={(paperId) =>
                    setActiveMenu(activeMenu === paperId ? null : paperId)
                  }
                  onMenuClose={() => setActiveMenu(null)}
                  formatDate={formatDate}
                  onCardClick={(paperId) => {
                    setSelectedPaperId(paperId);
                    setShowPaperViewModal(true);
                  }}
                  onEditClick={(paperId) => {
                    setSelectedPaperId(paperId);
                    setShowPaperEditModal(true);
                  }}
                  onDeleteClick={(paperId) => {
                    setSelectedPaperId(paperId);
                    setShowPaperDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

      {/* Standalone Modules Grid */}
      {(activeView === "all" || activeView === "modules") &&
        filteredModules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Individual Modules
              </h2>
              <span className="text-sm text-slate-500">
                ({filteredModules.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  activeMenu={activeMenu}
                  onMenuToggle={(moduleId) =>
                    setActiveMenu(activeMenu === moduleId ? null : moduleId)
                  }
                  onCardClick={handleViewModule}
                  onDeleteModule={(moduleId, moduleName) =>
                    setDeleteConfirm({
                      open: true,
                      moduleId,
                      moduleName,
                    })
                  }
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        )}

      {/* Empty State */}
      {visibleItems === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No content found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or filters, or create new content
          </p>
        </div>
      )}

      {/* Create Test Paper Modal */}
      <CreateModuleModal
        isOpen={showCreateModuleModal}
        onClose={() => setShowCreateModuleModal(false)}
        slug={slug}
      />

      {/* Delete Module Confirmation Dialog */}
      <DeleteModuleDialog
        isOpen={deleteConfirm.open}
        moduleName={deleteConfirm.moduleName}
        isDeleting={isDeleting}
        onConfirm={handleDeleteModule}
        onCancel={() =>
          setDeleteConfirm({
            open: false,
            moduleId: null,
            moduleName: null,
          })
        }
      />

      {/* Paper View Details Modal */}
      {selectedPaper && (
        <ViewPaperModal
          paper={{
            ...selectedPaper,
            readingModuleName:
              selectedPaper.readingModuleName ??
              getModuleNameById(selectedPaper.readingModuleId),
            listeningModuleName:
              selectedPaper.listeningModuleName ??
              getModuleNameById(selectedPaper.listeningModuleId),
            writingModuleName:
              selectedPaper.writingModuleName ??
              getModuleNameById(selectedPaper.writingModuleId),
            speakingModuleName:
              selectedPaper.speakingModuleName ??
              getModuleNameById(selectedPaper.speakingModuleId),
          }}
          isOpen={showPaperViewModal}
          onClose={() => {
            setShowPaperViewModal(false);
            setSelectedPaperId(null);
          }}
        />
      )}

      {/* Paper Edit Modal */}
      {selectedPaper && (
        <EditPaperModal
          paper={selectedPaper}
          isOpen={showPaperEditModal}
          onClose={() => {
            setShowPaperEditModal(false);
            setSelectedPaperId(null);
          }}
          availableModules={allModules}
          onSave={handleSavePaper}
        />
      )}

      {/* Paper Delete Confirmation Dialog */}
      {selectedPaper && (
        <DeleteConfirmationDialog
          isOpen={showPaperDeleteDialog}
          title="Delete Paper"
          description="This action will permanently remove the paper."
          itemName={selectedPaper.title}
          isDeleting={isPaperDeleting}
          onConfirm={handleConfirmDeletePaper}
          onCancel={() => {
            setShowPaperDeleteDialog(false);
            setSelectedPaperId(null);
          }}
        />
      )}
    </div>
  );
}
