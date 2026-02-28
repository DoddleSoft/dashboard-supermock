"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import {
  fetchStandaloneModules,
  createPaper,
  Module,
  fetchPapers,
  Paper,
  updatePaper,
  deletePaper,
  togglePaperStatus,
} from "@/helpers/papers";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { useModuleContext } from "@/context/ModuleContext";
import { CreatePaperModal } from "@/components/papers/CreatePaperModal";
import { PaperCardWithModules } from "@/components/ui/PaperCardWithModules";
import { toast } from "sonner";

export default function PapersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { currentCenter } = useCentre();

  const [searchQuery] = useState("");
  const [filterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [showCreatePaperModal, setShowCreatePaperModal] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { centerPapers } = useModuleContext();
  const [paperType, setPaperType] = useState<"IELTS" | "OIETC" | "GRE">(
    "IELTS",
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
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

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadData();
    }
  }, [currentCenter?.center_id]);

  useEffect(() => {
    // Check if URL has create=true parameter
    if (searchParams.get("create") === "true") {
      setShowCreatePaperModal(true);
    }
  }, [searchParams]);

  const filteredPapers = centerPapers.filter((paper) => {
    const matchesSearch = paper.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      paper.moduleTypes.map((t) => t.toLowerCase()).includes(filterType);
    return matchesSearch && matchesFilter;
  });

  const loadData = async () => {
    if (!currentCenter?.center_id) return;

    setLoading(true);
    const [papersData, modulesData] = await Promise.all([
      fetchPapers(currentCenter.center_id),
      fetchStandaloneModules(currentCenter.center_id),
    ]);
    setPapers(papersData);
    setAvailableModules(modulesData);
    setLoading(false);
  };

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
      loadData(); // Reload papers
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

    const currentPaper = papers.find((p) => p.id === paperId);
    if (result.success && currentPaper) {
      if (data.isActive !== currentPaper.is_active) {
        await togglePaperStatus(paperId, data.isActive);
      }
      await loadData();
    }

    return result;
  };

  const handleDeletePaper = async (paperId: string) => {
    const result = await deletePaper(paperId);
    if (result.success) {
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading papers..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Test Papers
            </h2>
            <span className="text-sm text-slate-500">
              ({filteredPapers.length})
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
        {papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
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
