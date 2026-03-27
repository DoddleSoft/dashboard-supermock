"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
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

type PaperModalState =
  | { kind: "closed" }
  | { kind: "view"; paperId: string }
  | { kind: "edit"; paperId: string }
  | { kind: "delete"; paperId: string };

export default function ModulesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [filterType, setFilterType] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [standaloneModules, setStandaloneModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [activeView, setActiveView] = useState<"all" | "papers" | "modules">(
    "all",
  );
  const [ownershipFilter, setOwnershipFilter] = useState<
    "all" | "private" | "public"
  >("all");
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

  // Unified paper modal state — only one modal can be open at a time
  const [paperModal, setPaperModal] = useState<PaperModalState>({
    kind: "closed",
  });
  const [isPaperDeleting, setIsPaperDeleting] = useState(false);

  const selectedPaperId =
    paperModal.kind !== "closed" ? paperModal.paperId : null;

  const { centerModulesLoading, refreshCenterModules } = useModuleContext();
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
      const result = await updatePaper(selectedPaperId, {
        title: data.title,
        paperType: data.paperType as "IELTS" | "OIETC" | "GRE",
        readingModuleId: data.readingModuleId || undefined,
        listeningModuleId: data.listeningModuleId || undefined,
        writingModuleId: data.writingModuleId || undefined,
        speakingModuleId: data.speakingModuleId || undefined,
        instruction: undefined,
      });

      if (result.success) {
        // Refresh context data in background — no loading spinner
        refreshCenterModules();
        refreshLocalModules();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: "Failed to update paper. Please try again.",
      };
    }
  };

  const handleConfirmDeletePaper = async () => {
    if (!selectedPaperId) return;
    setIsPaperDeleting(true);
    try {
      const result = await deletePaper(selectedPaperId);
      if (result.success) {
        // Refresh context data in background
        refreshCenterModules();
        refreshLocalModules();
      }
    } catch (error) {
      toast.error("Failed to delete the paper. Please try again.");
    } finally {
      setIsPaperDeleting(false);
      setPaperModal({ kind: "closed" });
      setActiveMenu(null);
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

  const filteredModules = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return standaloneModules.filter((module) => {
      const matchesSearch = module.heading.toLowerCase().includes(q);
      const matchesFilter =
        filterType === "all" || module.module_type.toLowerCase() === filterType;
      const matchesOwnership =
        ownershipFilter === "all" || module.view_option === ownershipFilter;
      return matchesSearch && matchesFilter && matchesOwnership;
    });
  }, [standaloneModules, deferredSearch, filterType, ownershipFilter]);

  // Show single loading state while data is loading
  if (centerModulesLoading || modulesLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading papers and modules..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col p-6 gap-6">
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
          </select>

          {/* Ownership Filter */}
          <select
            value={ownershipFilter}
            onChange={(e) =>
              setOwnershipFilter(e.target.value as "all" | "private" | "public")
            }
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
          >
            <option value="all">All Modules</option>
            <option value="private">My Modules</option>
            <option value="public">Public Modules</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModuleModal(true)}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Module
        </button>
      </div>

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
                  onDeleteModule={
                    module.view_option === "public"
                      ? undefined
                      : (moduleId, moduleName) =>
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

      {/* Empty state */}
      {(activeView === "all" || activeView === "modules") &&
        filteredModules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No modules found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery || filterType !== "all" || ownershipFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Create your first module to get started."}
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
    </div>
  );
}
