"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SmallLoader } from "@/components/ui/SmallLoader";

type AnswerDetail = {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  reference_id: string;
};

type ModuleDetail = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  feedback: string | null;
  band_score: number | null;
  score_obtained: number | null;
  answers: AnswerDetail[];
  studentName: string;
  studentEmail: string;
  paperTitle: string;
};

export default function GradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const moduleId = searchParams.get("moduleId");
  const slug = searchParams.get("slug") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetail | null>(null);
  const [feedback, setFeedback] = useState("");
  const [bandScore, setBandScore] = useState<number | null>(null);

  useEffect(() => {
    if (!attemptId || !moduleId) {
      toast.error("Missing attempt or module information");
      return;
    }
    void fetchModuleDetails();
  }, [attemptId, moduleId]);

  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch module details
      const { data: moduleData, error: moduleError } = await supabase
        .from("attempt_modules")
        .select(
          `
          id,
          status,
          feedback,
          band_score,
          score_obtained,
          module_id,
          attempt_id,
          modules!inner (
            id,
            module_type,
            heading,
            paper_id
          ),
          mock_attempts!inner (
            id,
            student_id
          )
        `,
        )
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;

      // Fetch student details
      const studentId = (moduleData?.mock_attempts as any)?.[0]?.student_id;
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

      // Fetch paper title
      const paperId = (moduleData?.modules as any)?.[0]?.paper_id;
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

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from("student_answers")
        .select(
          "id, question_ref, student_response, marks_awarded, reference_id",
        )
        .eq("attempt_module_id", moduleId)
        .order("question_ref");

      if (answersError) throw answersError;

      const moduleInfo = (moduleData?.modules as any)?.[0];

      const detail: ModuleDetail = {
        attemptModuleId: moduleData.id,
        moduleType: moduleInfo?.module_type || "unknown",
        heading: moduleInfo?.heading || null,
        status: moduleData.status,
        feedback: moduleData.feedback,
        band_score: moduleData.band_score,
        score_obtained: moduleData.score_obtained,
        answers: answersData || [],
        studentName,
        studentEmail,
        paperTitle,
      };

      setModuleDetail(detail);
      setFeedback(detail.feedback || "");
      setBandScore(detail.band_score);
    } catch (error: any) {
      console.error("Error loading module details:", error);
      toast.error("Failed to load module details");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (answerId: string, value: number) => {
    if (!moduleDetail) return;
    setModuleDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: prev.answers.map((answer) =>
          answer.id === answerId ? { ...answer, marks_awarded: value } : answer,
        ),
      };
    });
  };

  const calculateTotalScore = () => {
    if (!moduleDetail) return 0;
    return moduleDetail.answers.reduce(
      (sum, answer) => sum + (answer.marks_awarded || 0),
      0,
    );
  };

  const handleSaveGrades = async () => {
    if (!moduleDetail) return;

    try {
      setSaving(true);
      const supabase = createClient();

      // Update all answer marks
      const updatePromises = moduleDetail.answers.map((answer) =>
        supabase
          .from("student_answers")
          .update({ marks_awarded: answer.marks_awarded ?? 0 })
          .eq("id", answer.id),
      );

      await Promise.all(updatePromises);

      // Calculate total score
      const totalScore = calculateTotalScore();

      // Update module with feedback, band score, and total score
      const { error: moduleError } = await supabase
        .from("attempt_modules")
        .update({
          feedback: feedback || null,
          band_score: bandScore,
          score_obtained: totalScore,
          status: "completed",
        })
        .eq("id", moduleId);

      if (moduleError) throw moduleError;

      toast.success("Grades saved successfully!");
      await fetchModuleDetails(); // Refresh data
    } catch (error: any) {
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading grading details..." />
      </div>
    );
  }

  if (!moduleDetail) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">Module details not found</p>
        </div>
      </div>
    );
  }

  const maxMarksPerAnswer = moduleDetail.moduleType === "writing" ? 9 : 1;
  const totalScore = calculateTotalScore();
  const maxTotalScore = moduleDetail.answers.length * maxMarksPerAnswer;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${slug}/reviews`}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reviews
          </Link>
        </div>
        <button
          onClick={handleSaveGrades}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Grades
            </>
          )}
        </button>
      </div>

      {/* Student & Module Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Student Information
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                  {moduleDetail.studentName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {moduleDetail.studentName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {moduleDetail.studentEmail || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Module Information
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Paper:</span>
                <span className="font-medium text-slate-900">
                  {moduleDetail.paperTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Module:</span>
                <span className="font-medium text-slate-900 capitalize">
                  {moduleDetail.moduleType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Section:</span>
                <span className="font-medium text-slate-900">
                  {moduleDetail.heading || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="font-medium text-slate-900 capitalize">
                  {moduleDetail.status?.replace(/_/g, " ") || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Total Score</p>
              <p className="text-2xl font-bold text-slate-900">
                {totalScore} / {maxTotalScore}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Band Score</p>
              <input
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={bandScore || ""}
                onChange={(e) =>
                  setBandScore(
                    e.target.value ? parseFloat(e.target.value) : null,
                  )
                }
                placeholder="0.0 - 9.0"
                className="text-2xl font-bold text-slate-900 bg-transparent border-0 outline-none w-full"
              />
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Questions</p>
              <p className="text-2xl font-bold text-slate-900">
                {moduleDetail.answers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Student Answers
        </h2>
        <div className="space-y-4">
          {moduleDetail.answers.map((answer, index) => (
            <div
              key={answer.id}
              className="border border-slate-200 rounded-lg p-5"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-700">
                      Question: {answer.question_ref}
                    </p>
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

                <div className="w-full lg:w-64 flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Marks (max {maxMarksPerAnswer})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxMarksPerAnswer}
                      step={moduleDetail.moduleType === "writing" ? "0.5" : "1"}
                      value={answer.marks_awarded ?? ""}
                      onChange={(e) =>
                        handleMarkChange(
                          answer.id,
                          e.target.value ? parseFloat(e.target.value) : 0,
                        )
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {answer.marks_awarded !== null ? "Graded" : "Not graded"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Module Feedback
        </h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide detailed feedback for the student..."
          rows={6}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 resize-none"
        />
        <p className="text-sm text-slate-500 mt-2">
          This feedback will be visible to the student along with their grades.
        </p>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveGrades}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Grades...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save All Grades & Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
