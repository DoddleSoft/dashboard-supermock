import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface Paper {
  id: string;
  center_id: string;
  title: string;
  paper_type: "IELTS" | "OIETC" | "GRE";
  instruction?: string;
  tests_conducted: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  reading_module_id?: string;
  listening_module_id?: string;
  writing_module_id?: string;
  speaking_module_id?: string;
  reading_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  listening_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  writing_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  speaking_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
}

export interface CreatePaperPayload {
  centerId: string;
  title: string;
  paperType: "IELTS" | "OIETC" | "GRE";
  instruction?: string;
  readingModuleId?: string;
  listeningModuleId?: string;
  writingModuleId?: string;
  speakingModuleId?: string;
}

export interface Module {
  id: string;
  module_type: string;
  heading: string;
  subheading?: string;
  center_id: string;
  paper_id?: string | null;
  created_at: string;
}

/**
 * Fetch all papers for a center with their modules
 */
export const fetchPapers = async (centerId: string): Promise<Paper[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("papers")
      .select(
        `
        *,
        reading_module:modules!papers_reading_fk(id, heading, module_type),
        listening_module:modules!papers_listening_fk(id, heading, module_type),
        writing_module:modules!papers_writing_fk(id, heading, module_type),
        speaking_module:modules!papers_speaking_fk(id, heading, module_type)
      `,
      )
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching papers:", error);
    toast.error("Failed to load papers");
    return [];
  }
};

/**
 * Fetch standalone modules (not assigned to any paper)
 */
export const fetchStandaloneModules = async (
  centerId: string,
): Promise<Module[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("center_id", centerId)
      .is("paper_id", null)
      .order("module_type")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching standalone modules:", error);
    toast.error("Failed to load modules");
    return [];
  }
};

/**
 * Fetch all modules for a center (both standalone and paper-assigned)
 */
export const fetchCenterModules = async (
  centerId: string,
): Promise<Module[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("modules")
      .select(
        "id, module_type, heading, subheading, created_at, paper_id, center_id",
      )
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching center modules:", error);
    toast.error("Failed to load modules");
    return [];
  }
};

/**
 * Create a new paper
 */
export const createPaper = async (
  payload: CreatePaperPayload,
): Promise<{ success: boolean; paperId?: string; error?: string }> => {
  try {
    const supabase = createClient();

    // Validate at least one module is selected
    if (
      !payload.readingModuleId &&
      !payload.listeningModuleId &&
      !payload.writingModuleId &&
      !payload.speakingModuleId
    ) {
      toast.error("Please select at least one module");
      return { success: false, error: "No modules selected" };
    }

    // Validate title
    if (!payload.title?.trim()) {
      toast.error("Please enter a paper title");
      return { success: false, error: "Title is required" };
    }

    const { data: paper, error: paperError } = await supabase
      .from("papers")
      .insert({
        center_id: payload.centerId,
        title: payload.title.trim(),
        paper_type: payload.paperType,
        instruction: payload.instruction,
        reading_module_id: payload.readingModuleId,
        listening_module_id: payload.listeningModuleId,
        writing_module_id: payload.writingModuleId,
        speaking_module_id: payload.speakingModuleId,
        is_active: true,
      })
      .select()
      .single();

    if (paperError) throw paperError;

    toast.success("Paper created successfully!");
    return { success: true, paperId: paper.id };
  } catch (error: any) {
    console.error("Error creating paper:", error);
    toast.error("Failed to create paper. Please try again.");
    return { success: false, error: "Failed to create paper" };
  }
};

/**
 * Update an existing paper
 */
export const updatePaper = async (
  paperId: string,
  updates: Partial<CreatePaperPayload>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.paperType) updateData.paper_type = updates.paperType;
    if (updates.instruction !== undefined)
      updateData.instruction = updates.instruction;
    if (updates.readingModuleId !== undefined)
      updateData.reading_module_id = updates.readingModuleId;
    if (updates.listeningModuleId !== undefined)
      updateData.listening_module_id = updates.listeningModuleId;
    if (updates.writingModuleId !== undefined)
      updateData.writing_module_id = updates.writingModuleId;
    if (updates.speakingModuleId !== undefined)
      updateData.speaking_module_id = updates.speakingModuleId;

    const { error } = await supabase
      .from("papers")
      .update(updateData)
      .eq("id", paperId);

    if (error) throw error;

    toast.success("Paper updated successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating paper:", error);
    toast.error("Failed to update paper. Please try again.");
    return { success: false, error: "Failed to update paper" };
  }
};

/**
 * Delete a paper
 */
export const deletePaper = async (
  paperId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("papers").delete().eq("id", paperId);

    if (error) throw error;

    toast.success("Paper deleted successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting paper:", error);
    toast.error("Failed to delete paper. Please try again.");
    return { success: false, error: "Failed to delete paper" };
  }
};

/**
 * Toggle paper active status
 */
export const togglePaperStatus = async (
  paperId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("papers")
      .update({ is_active: isActive })
      .eq("id", paperId);

    if (error) throw error;

    toast.success(`Paper ${isActive ? "activated" : "deactivated"}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling paper status:", error);
    toast.error("Failed to update paper status. Please try again.");
    return { success: false, error: "Failed to update paper status" };
  }
};
