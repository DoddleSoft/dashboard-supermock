import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ----- Types from reviews/page.tsx -----

export type ReviewAnswerItem = {
  id: string;
  attempt_module_id: string;
  reference_id: string;
  question_ref: string;
  student_response: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
  created_at: string | null;
  attempt_modules: {
    id: string;
    attempt_id: string;
    status: string | null;
    score_obtained: number | null;
    band_score: number | null;
    time_spent_seconds: number | null;
    completed_at: string | null;
    module_id: string;
    modules: {
      id: string;
      module_type: string | null;
      heading: string | null;
      paper_id: string | null;
      center_id: string;
    }[];
    mock_attempts: {
      id: string;
      student_id: string | null;
      status: string | null;
      created_at: string | null;
      completed_at: string | null;
    }[];
  };
};

export type ReviewModuleEntry = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  score: number | null;
  band: number | null;
  timeSpentSeconds: number | null;
  completedAt: string | null;
  answers: ReviewAnswerItem[];
};

export type AttemptReview = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  status: string;
  createdAt: string | null;
  modules: ReviewModuleEntry[];
};

// ----- Types from reviews/preview/page.tsx -----

export type PreviewAnswerDetail = {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  reference_id: string;
};

export type PreviewModuleDetail = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  score_obtained: number | null;
  band_score: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
  answers: PreviewAnswerDetail[];
};

export type AttemptDetail = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  paperTitle: string;
  status: string;
  createdAt: string | null;
  modules: PreviewModuleDetail[];
};

// ----- Types from reviews/grade/page.tsx -----

export type GradeAnswerDetail = {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  reference_id: string;
  correct_answer?: string;
};

export type GradingDecision = {
  answerId: string;
  isCorrect: boolean;
  marksAwarded: number;
};

export type GradeModuleDetail = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  feedback: string | null;
  band_score: number | null;
  score_obtained: number | null;
  answers: GradeAnswerDetail[];
  studentName: string;
  studentEmail: string;
  paperTitle: string;
};

// ----- Formatting helpers -----

/**
 * Format a date for review display (e.g., "Jan 16, 2025, 02:30 PM")
 */
export const formatReviewDate = (value: string | null): string => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

/**
 * Format duration in seconds to a short string (e.g., "12 mins")
 */
export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  return `${mins} mins`;
};

/**
 * Format duration in seconds with seconds precision (e.g., "12m 30s")
 */
export const formatDurationDetailed = (seconds: number | null): string => {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/**
 * Get CSS classes for review status badges
 */
export const getReviewStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "in_progress":
    case "in-progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

// ----- Data fetching functions -----

/**
 * Fetch all reviews for a center (single RPC call)
 */
export const fetchReviews = async (
  centerId: string,
): Promise<AttemptReview[]> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_center_reviews", {
      p_center_id: centerId,
    });

    if (error) throw error;

    // RPC returns jsonb array directly with the right shape
    const reviews: AttemptReview[] = (data || []).map((item: any) => ({
      attemptId: item.attemptId,
      studentId: item.studentId,
      studentName: item.studentName || "Student",
      studentEmail: item.studentEmail || "",
      status: item.status || "unknown",
      createdAt: item.createdAt,
      modules: (item.modules || []).map((mod: any) => ({
        attemptModuleId: mod.attemptModuleId,
        moduleType: mod.moduleType || "unknown",
        heading: mod.heading,
        status: mod.status,
        score: mod.score,
        band: mod.band,
        timeSpentSeconds: mod.timeSpentSeconds,
        completedAt: mod.completedAt,
        answers: [], // Reviews listing doesn't need individual answers
      })),
    }));

    return reviews;
  } catch (error: any) {
    console.error("Error loading reviews:", error);
    toast.error("Failed to load reviews");
    return [];
  }
};

/**
 * Delete a mock attempt
 */
export const deleteAttempt = async (
  attemptId: string,
): Promise<{ success: boolean }> => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("mock_attempts")
      .delete()
      .eq("id", attemptId);
    if (error) throw error;
    toast.success("Attempt deleted successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting attempt:", error);
    toast.error("Failed to delete attempt");
    return { success: false };
  }
};

/**
 * Fetch attempt details for preview (single RPC call)
 */
export const fetchAttemptDetails = async (
  attemptId: string,
): Promise<AttemptDetail | null> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_attempt_preview", {
      p_attempt_id: attemptId,
    });

    if (error) throw error;
    if (!data || data.error) {
      toast.error("No modules found for this attempt");
      return null;
    }

    return {
      attemptId: data.attemptId,
      studentId: data.studentId || null,
      studentName: data.studentName || "Unknown Student",
      studentEmail: data.studentEmail || "",
      paperTitle: data.paperTitle || "Untitled Paper",
      status: data.status || "unknown",
      createdAt: data.createdAt || null,
      modules: (data.modules || []).map((mod: any) => ({
        attemptModuleId: mod.attemptModuleId,
        moduleType: mod.moduleType || "unknown",
        heading: mod.heading,
        status: mod.status,
        score_obtained: mod.score_obtained,
        band_score: mod.band_score,
        time_spent_seconds: mod.time_spent_seconds,
        completed_at: mod.completed_at,
        answers: mod.answers || [],
      })),
    };
  } catch (error: any) {
    console.error("Error loading attempt details:", error);
    toast.error("Failed to load attempt details");
    return null;
  }
};

/**
 * Fetch module details for grading (single RPC call)
 */
export const fetchGradeModuleDetails = async (
  moduleId: string,
): Promise<GradeModuleDetail | null> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_grading_data", {
      p_attempt_module_id: moduleId,
    });

    if (error) throw error;
    if (!data || data.error) {
      throw new Error(data?.error || "No module data found");
    }

    return {
      attemptModuleId: data.attemptModuleId,
      moduleType: data.moduleType || "unknown",
      heading: data.heading || null,
      status: data.status,
      feedback: data.feedback,
      band_score: data.band_score,
      score_obtained: data.score_obtained,
      answers: (data.answers || []).map((ans: any) => ({
        id: ans.id,
        question_ref: ans.question_ref,
        student_response: ans.student_response,
        marks_awarded: ans.marks_awarded,
        is_correct: ans.is_correct,
        reference_id: ans.reference_id,
        correct_answer: ans.correct_answer || "N/A",
      })),
      studentName: data.studentName || "Unknown Student",
      studentEmail: data.studentEmail || "",
      paperTitle: data.paperTitle || "Untitled Paper",
    };
  } catch (error: any) {
    console.error("Error loading module details:", error);
    toast.error(
      "Failed to load module details: " + (error.message || "Unknown error"),
    );
    return null;
  }
};

/**
 * Save grades for any module type (single RPC call)
 */
export const saveGrades = async (
  moduleId: string,
  answers: { id: string; is_correct: boolean; marks_awarded: number }[],
  feedback: string | null,
): Promise<{
  success: boolean;
  band_score?: number;
  total_score?: number;
  task1_score?: number;
  task2_score?: number;
  module_type?: string;
  updated_count?: number;
} | null> => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("save_grades", {
      p_module_id: moduleId,
      p_answers: answers,
      p_feedback: feedback,
    });

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error || "Failed to save grades");
    }

    return data;
  } catch (error: any) {
    console.error("Error saving grades:", error);
    throw error;
  }
};
