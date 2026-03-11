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
      // Single query using Supabase foreign key joins instead of 2 separate queries
      const { data: papers, error: papersError } = await supabase
        .from("papers")
        .select(
          `id,title,paper_type,is_active,created_at,
           reading_module_id,listening_module_id,writing_module_id,speaking_module_id,
           reading_module:modules!papers_reading_fk(id,module_type,heading),
           listening_module:modules!papers_listening_fk(id,module_type,heading),
           writing_module:modules!papers_writing_fk(id,module_type,heading),
           speaking_module:modules!papers_speaking_fk(id,module_type,heading)`,
        )
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (papersError) throw papersError;

      const moduleIdSet = new Set<string>();

      const summaries: PaperSummary[] = (papers || []).map((paper: any) => {
        const moduleTypes: string[] = [];
        let modulesCount = 0;

        const rm = Array.isArray(paper.reading_module)
          ? paper.reading_module[0]
          : paper.reading_module;
        const lm = Array.isArray(paper.listening_module)
          ? paper.listening_module[0]
          : paper.listening_module;
        const wm = Array.isArray(paper.writing_module)
          ? paper.writing_module[0]
          : paper.writing_module;
        const sm = Array.isArray(paper.speaking_module)
          ? paper.speaking_module[0]
          : paper.speaking_module;

        if (rm) {
          moduleTypes.push(rm.module_type);
          modulesCount++;
          moduleIdSet.add(rm.id);
        }
        if (lm) {
          moduleTypes.push(lm.module_type);
          modulesCount++;
          moduleIdSet.add(lm.id);
        }
        if (wm) {
          moduleTypes.push(wm.module_type);
          modulesCount++;
          moduleIdSet.add(wm.id);
        }
        if (sm) {
          moduleTypes.push(sm.module_type);
          modulesCount++;
          moduleIdSet.add(sm.id);
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
          readingModuleName: rm?.heading ?? null,
          listeningModuleName: lm?.heading ?? null,
          writingModuleName: wm?.heading ?? null,
          speakingModuleName: sm?.heading ?? null,
        };
      });

      const publishedPapers = summaries.filter((p) => p.isActive).length;

      const stats: ModuleOverviewStats = {
        totalPapers: summaries.length,
        totalModules: moduleIdSet.size,
        publishedPapers,
        draftPapers: summaries.length - publishedPapers,
      };

      return { papers: summaries, stats };
    } catch (err) {
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
