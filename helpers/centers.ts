import { createClient } from "@/lib/supabase/client";
import { PaperSummary, ModuleOverviewStats } from "@/context/ModuleContext";

export interface FetchCenterModulesResult {
  papers: PaperSummary[];
  stats: ModuleOverviewStats;
  error?: string;
}

export const centerHelpers = {
  fetchCenterModules: async (
    centerId: string,
  ): Promise<FetchCenterModulesResult> => {
    const supabase = createClient();

    try {
      const { data: papers, error: papersError } = await supabase
        .from("papers")
        .select("id,title,paper_type,is_active,created_at")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (papersError) throw papersError;

      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id,paper_id,module_type")
        .eq("center_id", centerId);

      if (modulesError) throw modulesError;

      const moduleCountsByPaper: Record<string, number> = {};
      const moduleTypesByPaper: Record<string, Set<string>> = {};

      (modules || []).forEach((mod) => {
        if (!mod.paper_id) return;
        moduleCountsByPaper[mod.paper_id] =
          (moduleCountsByPaper[mod.paper_id] || 0) + 1;
        if (!moduleTypesByPaper[mod.paper_id]) {
          moduleTypesByPaper[mod.paper_id] = new Set();
        }
        if (mod.module_type) {
          moduleTypesByPaper[mod.paper_id].add(mod.module_type);
        }
      });

      const summaries: PaperSummary[] = (papers || []).map((paper) => ({
        id: paper.id,
        title: paper.title,
        paperType: paper.paper_type,
        isActive: !!paper.is_active,
        createdAt: paper.created_at,
        modulesCount: moduleCountsByPaper[paper.id] || 0,
        moduleTypes: Array.from(moduleTypesByPaper[paper.id] || []),
      }));

      const publishedPapers = summaries.filter((p) => p.isActive).length;

      const stats: ModuleOverviewStats = {
        totalPapers: summaries.length,
        totalModules: (modules || []).length,
        publishedPapers,
        draftPapers: summaries.length - publishedPapers,
      };

      return { papers: summaries, stats };
    } catch (err) {
      console.error("Error fetching module overview:", err);
      return {
        papers: [],
        stats: {
          totalPapers: 0,
          totalModules: 0,
          publishedPapers: 0,
          draftPapers: 0,
        },
        error: err instanceof Error ? err.message : "Failed to load modules",
      };
    }
  },
};
