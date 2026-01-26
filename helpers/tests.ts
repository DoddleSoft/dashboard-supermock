import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface ScheduledTest {
  id: string;
  center_id: string;
  paper_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  otp: number | null;
  atendee: number | null;
  paper?: {
    title: string;
    paper_type: string;
    reading_module?: { id: string; heading: string; module_type: string };
    listening_module?: { id: string; heading: string; module_type: string };
    writing_module?: { id: string; heading: string; module_type: string };
    speaking_module?: { id: string; heading: string; module_type: string };
  };
  modules?: Array<{
    id: string;
    module_type: string;
    heading: string;
  }>;
  students?: Array<{
    student_id: string;
    name: string | null;
    email: string | null;
  }>;
}

export interface TestStats {
  totalTests: number;
  scheduledTests: number;
  completedTests: number;
  inProgressTests: number;
  totalModules: number;
  totalPapers: number;
}

export interface CreateTestPayload {
  centerId: string;
  paperId: string;
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
}

/**
 * Fetch a single scheduled test by ID
 */
export const fetchScheduledTest = async (
  testId: string,
): Promise<ScheduledTest | null> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("scheduled_tests")
      .select(
        `
        *,
        paper:papers!scheduled_tests_paper_id_fkey (
          id,
          title,
          paper_type,
          reading_module:modules!papers_reading_fk(id, heading, module_type),
          listening_module:modules!papers_listening_fk(id, heading, module_type),
          writing_module:modules!papers_writing_fk(id, heading, module_type),
          speaking_module:modules!papers_speaking_fk(id, heading, module_type)
        )
      `,
      )
      .eq("id", testId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch students
    const { data: studentsData } = await supabase
      .from("test_students")
      .select(
        `
        student:student_profiles!test_students_student_id_fkey (
          student_id,
          name,
          email
        )
      `,
      )
      .eq("test_id", data.id);

    // Build modules array
    const modules: Array<{
      id: string;
      module_type: string;
      heading: string;
    }> = [];

    if (data.paper?.reading_module) {
      modules.push(data.paper.reading_module);
    }
    if (data.paper?.listening_module) {
      modules.push(data.paper.listening_module);
    }
    if (data.paper?.writing_module) {
      modules.push(data.paper.writing_module);
    }
    if (data.paper?.speaking_module) {
      modules.push(data.paper.speaking_module);
    }

    return {
      ...data,
      modules,
      students: studentsData?.map((s: any) => s.student) || [],
    };
  } catch (error) {
    console.error("Error fetching scheduled test:", error);
    toast.error("Failed to load test data");
    return null;
  }
};

/**
 * Fetch all scheduled tests for a center
 */
export const fetchScheduledTests = async (
  centerId: string,
): Promise<ScheduledTest[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("scheduled_tests")
      .select(
        `
        *,
        paper:papers!scheduled_tests_paper_id_fkey (
          title,
          paper_type,
          reading_module:modules!papers_reading_fk(id, heading, module_type),
          listening_module:modules!papers_listening_fk(id, heading, module_type),
          writing_module:modules!papers_writing_fk(id, heading, module_type),
          speaking_module:modules!papers_speaking_fk(id, heading, module_type)
        )
      `,
      )
      .eq("center_id", centerId)
      .order("scheduled_at", { ascending: false });

    if (error) throw error;

    // Fetch students for each test and build modules array from paper
    const testsWithDetails = await Promise.all(
      (data || []).map(async (test) => {
        // Fetch students
        const { data: studentsData } = await supabase
          .from("test_students")
          .select(
            `
            student:student_profiles!test_students_student_id_fkey (
              student_id,
              name,
              email
            )
          `,
          )
          .eq("test_id", test.id);

        // Build modules array from paper module references
        const modules: Array<{
          id: string;
          module_type: string;
          heading: string;
        }> = [];

        if (test.paper?.reading_module) {
          modules.push(test.paper.reading_module);
        }
        if (test.paper?.listening_module) {
          modules.push(test.paper.listening_module);
        }
        if (test.paper?.writing_module) {
          modules.push(test.paper.writing_module);
        }
        if (test.paper?.speaking_module) {
          modules.push(test.paper.speaking_module);
        }

        return {
          ...test,
          modules,
          students: studentsData?.map((s: any) => s.student) || [],
        };
      }),
    );

    return testsWithDetails;
  } catch (error) {
    console.error("Error fetching scheduled tests:", error);
    toast.error("Failed to load tests");
    return [];
  }
};

/**
 * Get test statistics for a center
 */
export const fetchTestStats = async (
  centerId: string,
): Promise<TestStats | null> => {
  try {
    const supabase = createClient();

    // Get test counts by status
    const { data: tests, error: testsError } = await supabase
      .from("scheduled_tests")
      .select("status")
      .eq("center_id", centerId);

    if (testsError) throw testsError;

    // Get total modules count
    const { count: modulesCount, error: modulesError } = await supabase
      .from("modules")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId);

    if (modulesError) throw modulesError;

    // Get total papers count
    const { count: papersCount, error: papersError } = await supabase
      .from("papers")
      .select("*", { count: "exact", head: true })
      .eq("center_id", centerId);

    if (papersError) throw papersError;

    const totalTests = tests?.length || 0;
    const scheduledTests =
      tests?.filter((t) => t.status === "scheduled").length || 0;
    const completedTests =
      tests?.filter((t) => t.status === "completed").length || 0;
    const inProgressTests =
      tests?.filter((t) => t.status === "in_progress").length || 0;

    return {
      totalTests,
      scheduledTests,
      completedTests,
      inProgressTests,
      totalModules: modulesCount || 0,
      totalPapers: papersCount || 0,
    };
  } catch (error) {
    console.error("Error fetching test stats:", error);
    toast.error("Failed to load test statistics");
    return null;
  }
};

/**
 * Create a new scheduled test
 */
export const createScheduledTest = async (
  payload: CreateTestPayload,
): Promise<{ success: boolean; testId?: string; error?: string }> => {
  try {
    const supabase = createClient();

    console.log("Creating scheduled test with payload:", {
      center_id: payload.centerId,
      paper_id: payload.paperId,
      title: payload.title,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes || 180,
    });

    // Create the test
    const { data: test, error: testError } = await supabase
      .from("scheduled_tests")
      .insert({
        center_id: payload.centerId,
        paper_id: payload.paperId,
        title: payload.title,
        scheduled_at: payload.scheduledAt,
        duration_minutes: payload.durationMinutes || 180,
        status: "scheduled",
      })
      .select()
      .single();

    if (testError) {
      console.error("Test creation error:", testError);
      throw testError;
    }

    if (!test) {
      throw new Error("Test created but no data returned");
    }

    toast.success("Test scheduled successfully!");
    return { success: true, testId: test.id };
  } catch (error: any) {
    console.error("Error creating scheduled test:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });

    let errorMessage = "Failed to schedule test";

    if (error?.code === "42P01") {
      errorMessage =
        "Database table 'scheduled_tests' does not exist. Please run the migration first.";
    } else if (error?.code === "42501") {
      errorMessage =
        "Permission denied. Please disable RLS on 'scheduled_tests' table in Supabase.";
    } else if (error?.code === "23503") {
      errorMessage = "Invalid reference: Paper or center not found.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Update a scheduled test
 */
export const updateScheduledTest = async (
  testId: string,
  updates: Partial<CreateTestPayload>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.scheduledAt) updateData.scheduled_at = updates.scheduledAt;
    if (updates.durationMinutes)
      updateData.duration_minutes = updates.durationMinutes;
    if (updates.paperId) updateData.paper_id = updates.paperId;
    if (updates.status) updateData.status = updates.status;

    const { error: testError } = await supabase
      .from("scheduled_tests")
      .update(updateData)
      .eq("id", testId);

    if (testError) throw testError;

    toast.success("Test updated successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating scheduled test:", error);
    const errorMessage = error?.message || "Failed to update test";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Delete a scheduled test
 */
export const deleteScheduledTest = async (
  testId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("scheduled_tests")
      .delete()
      .eq("id", testId);

    if (error) throw error;

    toast.success("Test deleted successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting scheduled test:", error);
    const errorMessage = error?.message || "Failed to delete test";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Cancel a scheduled test
 */
export const cancelScheduledTest = async (
  testId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("scheduled_tests")
      .update({ status: "cancelled" })
      .eq("id", testId);

    if (error) throw error;

    toast.success("Test cancelled successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling scheduled test:", error);
    const errorMessage = error?.message || "Failed to cancel test";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};

/**
 * Generate and save OTP for a scheduled test (Server-Side)
 */
export const generateScheduledTestOtp = async (
  testId: string,
): Promise<{ success: boolean; otp?: number; error?: string }> => {
  try {
    const supabase = createClient();

    // Call the RPC function we created
    const { data, error } = await supabase.rpc("generate_unique_test_otp", {
      target_test_id: testId,
    });

    if (error) throw error;

    // Handle manual error returns from function (e.g. invalid ID)
    if (!data.success) {
      throw new Error(data.error);
    }

    toast.success("OTP generated successfully!");
    return { success: true, otp: data.otp };
  } catch (error: any) {
    console.error("Error generating OTP:", error);
    const errorMessage = error?.message || "Failed to generate OTP";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
};
