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
        .select(
          "id,title,paper_type,is_active,created_at,reading_module_id,listening_module_id,writing_module_id,speaking_module_id",
        )
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (papersError) throw papersError;

      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id,module_type,heading")
        .eq("center_id", centerId);

      if (modulesError) throw modulesError;

      // Create a map of module IDs to their types
      const moduleTypeMap: Record<string, string> = {};
      const moduleNameMap: Record<string, string> = {};
      (modules || []).forEach((mod) => {
        if (mod.id && mod.module_type) {
          moduleTypeMap[mod.id] = mod.module_type;
        }
        if (mod.id && mod.heading) {
          moduleNameMap[mod.id] = mod.heading;
        }
      });

      const summaries: PaperSummary[] = (papers || []).map((paper) => {
        const moduleTypes: string[] = [];
        let modulesCount = 0;

        // Check each module reference in the paper
        if (paper.reading_module_id && moduleTypeMap[paper.reading_module_id]) {
          moduleTypes.push(moduleTypeMap[paper.reading_module_id]);
          modulesCount++;
        }
        if (
          paper.listening_module_id &&
          moduleTypeMap[paper.listening_module_id]
        ) {
          moduleTypes.push(moduleTypeMap[paper.listening_module_id]);
          modulesCount++;
        }
        if (paper.writing_module_id && moduleTypeMap[paper.writing_module_id]) {
          moduleTypes.push(moduleTypeMap[paper.writing_module_id]);
          modulesCount++;
        }
        if (
          paper.speaking_module_id &&
          moduleTypeMap[paper.speaking_module_id]
        ) {
          moduleTypes.push(moduleTypeMap[paper.speaking_module_id]);
          modulesCount++;
        }

        return {
          id: paper.id,
          title: paper.title,
          paperType: paper.paper_type,
          isActive: !!paper.is_active,
          createdAt: paper.created_at,
          modulesCount,
          moduleTypes,
          readingModuleId: paper.reading_module_id ?? null,
          listeningModuleId: paper.listening_module_id ?? null,
          writingModuleId: paper.writing_module_id ?? null,
          speakingModuleId: paper.speaking_module_id ?? null,
          readingModuleName: moduleNameMap[paper.reading_module_id] ?? null,
          listeningModuleName: moduleNameMap[paper.listening_module_id] ?? null,
          writingModuleName: moduleNameMap[paper.writing_module_id] ?? null,
          speakingModuleName: moduleNameMap[paper.speaking_module_id] ?? null,
        };
      });

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
