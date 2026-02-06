"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Edit3, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { useParams } from "next/navigation";

type AnswerDetail = {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  reference_id: string;
};

type ModuleDetail = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  score_obtained: number | null;
  band_score: number | null;
  time_spent_seconds: number | null;
  completed_at: string | null;
  answers: AnswerDetail[];
};

type AttemptDetail = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  paperTitle: string;
  status: string;
  createdAt: string | null;
  modules: ModuleDetail[];
};

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const attemptId = searchParams.get("attemptId");

  const [loading, setLoading] = useState(true);
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(
    null,
  );
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  useEffect(() => {
    if (!attemptId) {
      toast.error("Missing attempt information");
      return;
    }
    void fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch attempt modules
      const { data: attemptModulesData, error: amError } = await supabase
        .from("attempt_modules")
        .select(
          `id,attempt_id,status,score_obtained,band_score,time_spent_seconds,completed_at,module_id,module_type,
          modules!inner (id,module_type,heading,paper_id),
          mock_attempts!inner (id,student_id,status,created_at)`,
        )
        .eq("attempt_id", attemptId);

      if (amError) throw amError;

      if (!attemptModulesData || attemptModulesData.length === 0) {
        toast.error("No modules found for this attempt");
        return;
      }

      // Get all attempt_module IDs
      const attemptModuleIds = attemptModulesData.map((am: any) => am.id);

      // Fetch all student answers for these modules
      const { data: answersData, error: answersError } = await supabase
        .from("student_answers")
        .select(
          "id,attempt_module_id,question_ref,student_response,marks_awarded,is_correct,reference_id",
        )
        .in("attempt_module_id", attemptModuleIds)
        .order("question_ref");

      if (answersError) throw answersError;

      // Get student info
      const firstModule = attemptModulesData[0];
      const mockAttempt = Array.isArray(firstModule.mock_attempts)
        ? firstModule.mock_attempts[0]
        : firstModule.mock_attempts;
      const studentId = mockAttempt?.student_id;

      let studentName = "Unknown Student";
      let studentEmail = "";

      if (studentId) {
        const { data: studentData, error: studentError } = await supabase
          .from("student_profiles")
          .select("name, email")
          .eq("student_id", studentId)
          .single();

        if (!studentError && studentData) {
          studentName = studentData.name || "Unknown Student";
          studentEmail = studentData.email || "";
        }
      }

      // Get paper title
      const moduleInfo = Array.isArray(firstModule.modules)
        ? firstModule.modules[0]
        : firstModule.modules;
      const paperId = moduleInfo?.paper_id;

      let paperTitle = "Untitled Paper";

      if (paperId) {
        const { data: paperData, error: paperError } = await supabase
          .from("papers")
          .select("title")
          .eq("id", paperId)
          .single();

        if (!paperError && paperData) {
          paperTitle = paperData.title || "Untitled Paper";
        }
      }

      // Build module structure
      const modules: ModuleDetail[] = attemptModulesData.map((am: any) => {
        const modInfo = Array.isArray(am.modules) ? am.modules[0] : am.modules;
        const moduleAnswers = (answersData || []).filter(
          (ans: any) => ans.attempt_module_id === am.id,
        );

        return {
          attemptModuleId: am.id,
          moduleType: am.module_type || modInfo.module_type || "unknown",
          heading: modInfo.heading,
          status: am.status,
          score_obtained: am.score_obtained,
          band_score: am.band_score,
          time_spent_seconds: am.time_spent_seconds,
          completed_at: am.completed_at,
          answers: moduleAnswers,
        };
      });

      const detail: AttemptDetail = {
        attemptId: attemptId!,
        studentId: studentId || null,
        studentName,
        studentEmail,
        paperTitle,
        status: mockAttempt?.status || "unknown",
        createdAt: mockAttempt?.created_at || null,
        modules,
      };

      setAttemptDetail(detail);
    } catch (error: any) {
      console.error("Error loading attempt details:", error);
      toast.error("Failed to load attempt details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading attempt details..." />
      </div>
    );
  }

  if (!attemptDetail) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">Attempt details not found</p>
        </div>
      </div>
    );
  }

  const selectedModule = attemptDetail.modules[selectedModuleIndex];
  const isWriting = selectedModule?.moduleType === "writing";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/dashboard/${slug}/reviews`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reviews
        </button>
      </div>

      {/* Student & Attempt Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Student Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-lg">
                  {attemptDetail.studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-lg">
                    {attemptDetail.studentName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {attemptDetail.studentEmail || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Attempt Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Paper:</span>
                <span className="font-medium text-slate-900">
                  {attemptDetail.paperTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                    attemptDetail.status,
                  )}`}
                >
                  {attemptDetail.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Started:</span>
                <span className="font-medium text-slate-900">
                  {formatDate(attemptDetail.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Modules:</span>
                <span className="font-medium text-slate-900">
                  {attemptDetail.modules.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {attemptDetail.modules.map((module, index) => (
            <button
              key={module.attemptModuleId}
              onClick={() => setSelectedModuleIndex(index)}
              className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedModuleIndex === index
                  ? "bg-red-600 text-white"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="text-left">
                <p className="text-sm font-semibold uppercase">
                  {module.moduleType}
                </p>
                <p className="text-xs opacity-80">
                  {module.answers.length} questions
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Module Content */}
      {selectedModule && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {/* Module Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 capitalize">
                {selectedModule.moduleType} Module
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {selectedModule.heading || "Module Section"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {selectedModule.score_obtained || 0}
                  {selectedModule.band_score && (
                    <span className="text-base text-slate-600 ml-2">
                      (Band {selectedModule.band_score})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Duration</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatDuration(selectedModule.time_spent_seconds)}
                </p>
              </div>
              {isWriting && (
                <Link
                  href={`/dashboard/${slug}/reviews/grade?attemptId=${attemptDetail.attemptId}&moduleId=${selectedModule.attemptModuleId}&slug=${slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Grade Writing
                </Link>
              )}
            </div>
          </div>

          {/* Answers Display */}
          {isWriting ? (
            // Writing Module - Show detailed responses
            <div className="space-y-4">
              {selectedModule.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="border border-slate-200 rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        Question: {answer.question_ref}
                      </p>
                    </div>
                    {answer.marks_awarded !== null && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Score</p>
                        <p className="text-lg font-bold text-slate-900">
                          {answer.marks_awarded}/9
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Student Response:
                    </p>
                    <div className="text-sm text-slate-900 whitespace-pre-line">
                      {answer.student_response || (
                        <span className="text-slate-400 italic">
                          No response provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Other Modules - Show table format
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Student Answer
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedModule.answers.map((answer, index) => (
                    <tr
                      key={answer.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {answer.question_ref}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {answer.student_response || (
                          <span className="text-slate-400 italic">
                            No answer
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {answer.is_correct === null ? (
                          <span className="text-slate-400 text-xs">
                            Not graded
                          </span>
                        ) : answer.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-slate-900">
                        {answer.marks_awarded !== null ? (
                          <span>{answer.marks_awarded}/1</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
