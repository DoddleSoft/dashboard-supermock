"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import {
  fetchStandaloneModules,
  createPaper,
  Module,
  updatePaper,
  deletePaper,
  togglePaperStatus,
} from "@/helpers/papers";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { useModuleContext } from "@/context/ModuleContext";
import { CreatePaperModal } from "@/components/papers/CreatePaperModal";
import { PaperCardWithModules } from "@/components/ui/PaperCardWithModules";
import { toast } from "sonner";

function PapersPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { currentCenter } = useCentre();

  const [showCreatePaperModal, setShowCreatePaperModal] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { centerPapers, centerModulesLoading, refreshCenterModules } =
    useModuleContext();

  const [paperType, setPaperType] = useState<"IELTS" | "OIETC" | "GRE">(
    "IELTS",
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [selectedModules, setSelectedModules] = useState<{
    reading?: string;
    listening?: string;
    writing?: string;
    speaking?: string;
  }>({});
  const [showModuleDropdown, setShowModuleDropdown] = useState<string | null>(
    null,
  );
  const [creatingPaper, setCreatingPaper] = useState(false);

  const loadModules = useCallback(async () => {
    if (!currentCenter?.center_id) return;
    setModulesLoading(true);
    const modulesData = await fetchStandaloneModules(currentCenter.center_id);
    setAvailableModules(modulesData);
    setModulesLoading(false);
  }, [currentCenter?.center_id]);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadModules();
    }
  }, [currentCenter?.center_id, loadModules]);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreatePaperModal(true);
    }
  }, [searchParams]);

  const handleCreatePaper = async () => {
    if (!paperTitle.trim()) {
      toast.error("Please enter a paper title");
      return;
    }

    if (
      !selectedModules.reading &&
      !selectedModules.listening &&
      !selectedModules.writing &&
      !selectedModules.speaking
    ) {
      toast.error("Please select at least one module");
      return;
    }

    if (!currentCenter?.center_id) {
      toast.error("No center selected. Please select a center first.");
      return;
    }

    setCreatingPaper(true);

    const result = await createPaper({
      centerId: currentCenter.center_id,
      title: paperTitle,
      paperType: paperType,
      readingModuleId: selectedModules.reading,
      listeningModuleId: selectedModules.listening,
      writingModuleId: selectedModules.writing,
      speakingModuleId: selectedModules.speaking,
    });

    setCreatingPaper(false);

    if (result.success) {
      setShowCreatePaperModal(false);
      setPaperTitle("");
      setSelectedModules({});
      await Promise.all([refreshCenterModules(), loadModules()]);
    }
  };

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
      const currentPaper = centerPapers.find((p) => p.id === paperId);
      if (currentPaper && data.isActive !== currentPaper.isActive) {
        const toggleResult = await togglePaperStatus(paperId, data.isActive);
        if (!toggleResult.success) {
          toast.error(toggleResult.error || "Failed to update paper status.");
        }
      }
      await refreshCenterModules();
    }

    return result;
  };

  const handleDeletePaper = async (paperId: string) => {
    const result = await deletePaper(paperId);
    if (result.success) {
      await refreshCenterModules();
    }
  };

  if (centerModulesLoading || modulesLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading papers..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Test Papers
            </h2>
            <span className="text-sm text-slate-500">
              ({centerPapers.length})
            </span>
          </div>

          <button
            onClick={() => setShowCreatePaperModal(true)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Paper
          </button>
        </div>

        {/* Papers Grid */}
        {centerPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centerPapers.map((paper) => (
              <PaperCardWithModules
                key={paper.id}
                paper={paper}
                activeMenu={activeMenu}
                onMenuToggle={(paperId) =>
                  setActiveMenu(activeMenu === paperId ? null : paperId)
                }
                onMenuClose={() => setActiveMenu(null)}
                availableModules={availableModules}
                onPaperUpdate={handleUpdatePaper}
                onPaperDelete={handleDeletePaper}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-1">No papers created yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Create your first paper by combining modules
            </p>
            <button
              onClick={() => setShowCreatePaperModal(true)}
              className="inline-flex px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              Create Paper
            </button>
          </div>
        )}
      </div>

      {/* Create Paper Modal */}
      <CreatePaperModal
        isOpen={showCreatePaperModal}
        onClose={() => setShowCreatePaperModal(false)}
        paperTitle={paperTitle}
        setPaperTitle={setPaperTitle}
        paperType={paperType}
        setPaperType={setPaperType}
        availableModules={availableModules}
        selectedModules={selectedModules}
        setSelectedModules={setSelectedModules}
        showModuleDropdown={showModuleDropdown}
        setShowModuleDropdown={setShowModuleDropdown}
        creatingPaper={creatingPaper}
        onCreatePaper={handleCreatePaper}
        slug={slug}
      />
    </>
  );
}

export default function PapersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto">
          <SmallLoader subtitle="Loading papers..." />
        </div>
      }
    >
      <PapersPageContent />
    </Suspense>
  );
}
