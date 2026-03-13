import { createClient } from "@/lib/supabase/client";

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

// ----- RPC response shapes (for typed mappers) -----

interface PreviewRpcModule {
  attemptModuleId: string;
  moduleType: string | null;
  heading: string | null;
  status: string | null;
  score_obtained: number | null;
  band_score: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
  answers: PreviewAnswerDetail[];
}

interface PreviewRpcResponse {
  attemptId: string;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
  paperTitle: string | null;
  status: string | null;
  createdAt: string | null;
  modules: PreviewRpcModule[];
  error?: string;
}

interface GradeRpcAnswer {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  reference_id: string;
  correct_answer: string | null;
}

interface GradeRpcResponse {
  attemptModuleId: string;
  moduleType: string | null;
  heading: string | null;
  status: string | null;
  feedback: string | null;
  band_score: number | null;
  score_obtained: number | null;
  answers: GradeRpcAnswer[];
  studentName: string | null;
  studentEmail: string | null;
  paperTitle: string | null;
  error?: string;
}

// ----- Data fetching functions -----

/**
 * Fetch attempt details for preview (single RPC call).
 * Throws on failure — callers should catch and display errors.
 */
export const fetchAttemptDetails = async (
  attemptId: string,
): Promise<AttemptDetail | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_attempt_preview", {
    p_attempt_id: attemptId,
  });

  if (error) throw error;

  const rpc = data as PreviewRpcResponse | null;
  if (!rpc || rpc.error) {
    throw new Error(rpc?.error || "No modules found for this attempt");
  }

  return {
    attemptId: rpc.attemptId,
    studentId: rpc.studentId ?? null,
    studentName: rpc.studentName ?? "Unknown Student",
    studentEmail: rpc.studentEmail ?? "",
    paperTitle: rpc.paperTitle ?? "Untitled Paper",
    status: rpc.status ?? "unknown",
    createdAt: rpc.createdAt ?? null,
    modules: (rpc.modules || []).map((mod: PreviewRpcModule) => ({
      attemptModuleId: mod.attemptModuleId,
      moduleType: mod.moduleType ?? "unknown",
      heading: mod.heading,
      status: mod.status,
      score_obtained: mod.score_obtained,
      band_score: mod.band_score,
      time_spent_seconds: mod.time_spent_seconds,
      completed_at: mod.completed_at,
      answers: mod.answers || [],
    })),
  };
};

/**
 * Fetch module details for grading (single RPC call).
 * Throws on failure — callers should catch and display errors.
 */
export const fetchGradeModuleDetails = async (
  moduleId: string,
): Promise<GradeModuleDetail | null> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_grading_data", {
    p_attempt_module_id: moduleId,
  });

  if (error) throw error;

  const rpc = data as GradeRpcResponse | null;
  if (!rpc || rpc.error) {
    throw new Error(rpc?.error || "No module data found");
  }

  return {
    attemptModuleId: rpc.attemptModuleId,
    moduleType: rpc.moduleType ?? "unknown",
    heading: rpc.heading ?? null,
    status: rpc.status,
    feedback: rpc.feedback,
    band_score: rpc.band_score,
    score_obtained: rpc.score_obtained,
    answers: (rpc.answers || []).map((ans: GradeRpcAnswer) => ({
      id: ans.id,
      question_ref: ans.question_ref,
      student_response: ans.student_response,
      marks_awarded: ans.marks_awarded,
      is_correct: ans.is_correct,
      reference_id: ans.reference_id,
      correct_answer: ans.correct_answer ?? "N/A",
    })),
    studentName: rpc.studentName ?? "Unknown Student",
    studentEmail: rpc.studentEmail ?? "",
    paperTitle: rpc.paperTitle ?? "Untitled Paper",
  };
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
    throw error;
  }
};
