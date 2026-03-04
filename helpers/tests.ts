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

export interface PaperWithModules {
  id: string;
  title: string;
  paper_type: string;
  reading_module?: { id: string; heading: string; module_type: string };
  listening_module?: { id: string; heading: string; module_type: string };
  writing_module?: { id: string; heading: string; module_type: string };
  speaking_module?: { id: string; heading: string; module_type: string };
}

/**
 * Fetch all active papers for a center (with module details)
 */
export const fetchActivePapers = async (
  centerId: string,
): Promise<PaperWithModules[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("papers")
      .select(
        `
        id,
        title,
        paper_type,
        reading_module:modules!papers_reading_fk(id, heading, module_type),
        listening_module:modules!papers_listening_fk(id, heading, module_type),
        writing_module:modules!papers_writing_fk(id, heading, module_type),
        speaking_module:modules!papers_speaking_fk(id, heading, module_type)
      `,
      )
      .eq("center_id", centerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      paper_type: p.paper_type,
      reading_module: Array.isArray(p.reading_module)
        ? p.reading_module[0]
        : p.reading_module,
      listening_module: Array.isArray(p.listening_module)
        ? p.listening_module[0]
        : p.listening_module,
      writing_module: Array.isArray(p.writing_module)
        ? p.writing_module[0]
        : p.writing_module,
      speaking_module: Array.isArray(p.speaking_module)
        ? p.speaking_module[0]
        : p.speaking_module,
    }));
  } catch (error) {
    console.error("Error fetching active papers:", error);
    toast.error("Failed to load papers. Please refresh the page.");
    return [];
  }
};

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
 * Create a new scheduled test
 */
export const createScheduledTest = async (
  payload: CreateTestPayload,
): Promise<{ success: boolean; testId?: string; error?: string }> => {
  try {
    const supabase = createClient();

    // Validate required fields
    if (!payload.title?.trim()) {
      toast.error("Please enter a test title");
      return { success: false, error: "Title is required" };
    }

    if (!payload.scheduledAt) {
      toast.error("Please select a date and time for the test");
      return { success: false, error: "Scheduled date is required" };
    }

    if (!payload.paperId) {
      toast.error("Please select a paper for the test");
      return { success: false, error: "Paper is required" };
    }

    console.log("Creating scheduled test with payload:", {
      center_id: payload.centerId,
      paper_id: payload.paperId,
      title: payload.title,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes || 180,
    });

    // Calculate ended_at based on scheduled_at and duration
    const durationMinutes = payload.durationMinutes || 180;
    const scheduledDate = new Date(payload.scheduledAt);
    const endedDate = new Date(
      scheduledDate.getTime() + durationMinutes * 60000,
    );

    // Create the test
    const { data: test, error: testError } = await supabase
      .from("scheduled_tests")
      .insert({
        center_id: payload.centerId,
        paper_id: payload.paperId,
        title: payload.title.trim(),
        scheduled_at: payload.scheduledAt,
        ended_at: endedDate.toISOString(),
        duration_minutes: durationMinutes,
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
      errorMessage = "Failed to schedule test. Please try again.";
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

    // Calculate ended_at whenever scheduled_at or duration changes
    if (updates.scheduledAt || updates.durationMinutes) {
      // Fetch current test data to get missing values
      const { data: currentTest } = await supabase
        .from("scheduled_tests")
        .select("scheduled_at, duration_minutes")
        .eq("id", testId)
        .single();

      const scheduledAt = updates.scheduledAt || currentTest?.scheduled_at;
      const durationMinutes =
        updates.durationMinutes || currentTest?.duration_minutes || 180;

      if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        const endedDate = new Date(
          scheduledDate.getTime() + durationMinutes * 60000,
        );
        updateData.ended_at = endedDate.toISOString();
      }
    }

    const { error: testError } = await supabase
      .from("scheduled_tests")
      .update(updateData)
      .eq("id", testId);

    if (testError) throw testError;

    toast.success("Test updated successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating scheduled test:", error);
    toast.error("Failed to update test. Please try again.");
    return { success: false, error: "Failed to update test" };
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

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting scheduled test:", error);
    toast.error("Failed to delete test. Please try again.");
    return { success: false, error: "Failed to delete test" };
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
    toast.error("Failed to cancel test. Please try again.");
    return { success: false, error: "Failed to cancel test" };
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

    return { success: true, otp: data.otp };
  } catch (error: any) {
    console.error("Error generating OTP:", error);
    toast.error("Failed to generate OTP. Please try again.");
    return { success: false, error: "Failed to generate OTP" };
  }
};

// ----- Student helpers -----

export interface TestStudent {
  attempt_id: string;
  attempt_status: string;
  overall_band_score: number | null;
  started_at: string;
  completed_at: string | null;
  student: {
    student_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    enrollment_type: string;
    guardian: string | null;
  };
}

/**
 * Fetch all students registered under a scheduled test via mock_attempts
 */
export const fetchTestStudents = async (
  testId: string,
): Promise<TestStudent[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("mock_attempts")
      .select(
        `
        id,
        status,
        overall_band_score,
        started_at,
        completed_at,
        student:student_profiles!mock_attempts_student_id_fkey (
          student_id,
          name,
          email,
          phone,
          enrollment_type,
          guardian
        )
      `,
      )
      .eq("scheduled_test_id", testId)
      .order("started_at", { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      attempt_id: row.id,
      attempt_status: row.status,
      overall_band_score: row.overall_band_score,
      started_at: row.started_at,
      completed_at: row.completed_at,
      student: Array.isArray(row.student) ? row.student[0] : row.student,
    }));
  } catch (error) {
    console.error("Error fetching test students:", error);
    toast.error("Failed to load students for this test");
    return [];
  }
};

// ----- Formatting helpers -----

/**
 * Get CSS classes for test status badges
 */
export const getTestStatusColor = (status: string): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

/**
 * Format a date string for test display (e.g., "Jan 16, 2025, 2:30 PM")
 */
export const formatTestDate = (dateString: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
};

/**
 * Format a test status string for display (e.g., "in_progress" → "In Progress")
 */
export const formatTestStatus = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
