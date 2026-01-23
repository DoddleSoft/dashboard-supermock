"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Filter, MoreVertical, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCentre } from "@/context/CentreContext";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { toast } from "sonner";

type AnswerItem = {
  id: string;
  attempt_module_id: string;
  sub_section_id: string;
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

type ModuleReview = {
  attemptModuleId: string;
  moduleType: string;
  heading: string | null;
  status: string | null;
  score: number | null;
  band: number | null;
  timeSpentSeconds: number | null;
  completedAt: string | null;
  answers: AnswerItem[];
};

type AttemptReview = {
  attemptId: string;
  studentId: string | null;
  studentName: string;
  studentEmail: string;
  paperTitle: string;
  status: string;
  createdAt: string | null;
  modules: ModuleReview[];
};

export default function ReviewPage() {
  const { currentCenter } = useCentre();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AttemptReview[]>([]);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(
    null,
  );
  const [savingMarks, setSavingMarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentCenter?.center_id) return;
    void fetchReviews();
  }, [currentCenter?.center_id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("student_answers")
        .select(
          `id,attempt_module_id,sub_section_id,question_ref,student_response,is_correct,marks_awarded,created_at,
          attempt_modules!inner (
            id,attempt_id,status,score_obtained,band_score,time_spent_seconds,completed_at,module_id,
            modules!inner (id,module_type,heading,paper_id,center_id),
            mock_attempts (id,student_id,status,created_at,completed_at)
          )`,
        )
        .eq("attempt_modules.modules.center_id", currentCenter!.center_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const attemptMap = new Map<string, AttemptReview>();
      const studentIds = new Set<string>();
      const paperIds = new Set<string>();

      let studentProfileMap = new Map<
        string,
        { name: string; email: string }
      >();
      if (studentIds.size > 0) {
        const { data: students, error: studentError } = await supabase
          .from("student_profiles")
          .select("student_id,name,email")
          .in("student_id", Array.from(studentIds));

        if (!studentError) {
          (students || []).forEach((student: any) => {
            studentProfileMap.set(student.student_id, {
              name: student.name || "Unnamed Student",
              email: student.email || "",
            });
          });
        }
      }

      let paperTitleMap = new Map<string, string>();
      if (paperIds.size > 0) {
        const { data: papers, error: paperError } = await supabase
          .from("papers")
          .select("id,title")
          .in("id", Array.from(paperIds));

        if (!paperError) {
          (papers || []).forEach((paper: any) => {
            paperTitleMap.set(paper.id, paper.title || "Untitled");
          });
        }
      }

      const prepared = Array.from(attemptMap.values()).map((attempt) => {
        const profile = attempt.studentId
          ? studentProfileMap.get(attempt.studentId)
          : null;

        let resolvedTitle: string | undefined;
        for (const module of attempt.modules) {
          if (module.answers.length > 0) {
            const paperId =
              module.answers[0].attempt_modules.modules[0]?.paper_id;
            if (paperId) {
              resolvedTitle = paperTitleMap.get(paperId);
              if (resolvedTitle) break;
            }
          }
        }

        return {
          ...attempt,
          studentName: profile?.name || "Student",
          studentEmail: profile?.email || "",
          paperTitle: resolvedTitle || attempt.paperTitle || "Untitled",
        };
      });

      setReviews(prepared);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((attempt) => {
      const matchesSearch =
        attempt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attempt.studentEmail
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        attempt.paperTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule =
        selectedModule === "all" ||
        attempt.modules.some((mod) => mod.moduleType === selectedModule);

      const statusKey = attempt.status.toLowerCase().replace(/[\s_]+/g, "-");
      const matchesStatus =
        selectedStatus === "all" || statusKey === selectedStatus;

      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [reviews, searchQuery, selectedModule, selectedStatus]);

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
    return `${mins} mins`;
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

  const handleMarkChange = (
    attemptId: string,
    moduleId: string,
    answerId: string,
    value: number,
  ) => {
    setReviews((prev) =>
      prev.map((attempt) => {
        if (attempt.attemptId !== attemptId) return attempt;
        return {
          ...attempt,
          modules: attempt.modules.map((module) => {
            if (module.attemptModuleId !== moduleId) return module;
            return {
              ...module,
              answers: module.answers.map((answer) =>
                answer.id === answerId
                  ? { ...answer, marks_awarded: value }
                  : answer,
              ),
            };
          }),
        };
      }),
    );
  };

  const updateMark = async (answerId: string, marks: number | null) => {
    try {
      setSavingMarks((prev) => ({ ...prev, [answerId]: true }));
      const supabase = createClient();
      const { error } = await supabase
        .from("student_answers")
        .update({ marks_awarded: marks ?? 0 })
        .eq("id", answerId);

      if (error) throw error;
      toast.success("Marks updated");
    } catch (error: any) {
      console.error("Error updating marks:", error);
      toast.error("Failed to update marks");
    } finally {
      setSavingMarks((prev) => ({ ...prev, [answerId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or paper..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="all">All Modules</option>
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
      </div>

      {loading && <SmallLoader subtitle="Loading reviews..." />}

      {!loading && (
        <div className="bg-white rounded-xl border mt-6 border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Test Paper
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReviews.map((attempt) => (
                <Fragment key={attempt.attemptId}>
                  <tr className="hover:bg-slate-50 transition-colors duration-150 text-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm">
                          {attempt.studentName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-slate-900">
                            {attempt.studentName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {attempt.studentEmail || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {attempt.paperTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      <div className="flex flex-wrap gap-2">
                        {attempt.modules.map((mod) => (
                          <span
                            key={mod.attemptModuleId}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"
                          >
                            {mod.moduleType}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          attempt.status,
                        )}`}
                      >
                        {attempt.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                      {formatDate(attempt.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAttemptId((prev) =>
                            prev === attempt.attemptId
                              ? null
                              : attempt.attemptId,
                          )
                        }
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        aria-label="Toggle answers"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </td>
                  </tr>

                  {expandedAttemptId === attempt.attemptId && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-6 py-5">
                        <div className="space-y-4">
                          {attempt.modules.map((module) => (
                            <div
                              key={module.attemptModuleId}
                              className="bg-white rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <div>
                                  <p className="text-sm font-semibold text-slate-700 uppercase">
                                    {module.moduleType}
                                  </p>
                                  <p className="text-base font-semibold text-slate-900">
                                    {module.heading || "Module"}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                  <span>
                                    Status:{" "}
                                    {module.status?.replace(/_/g, " ") || "-"}
                                  </span>
                                  <span>
                                    Duration:{" "}
                                    {formatDuration(module.timeSpentSeconds)}
                                  </span>
                                  <span>
                                    Completed: {formatDate(module.completedAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {module.answers.map((answer) => {
                                  const maxMarks =
                                    module.moduleType === "writing" ? 9 : 1;
                                  const isWriting =
                                    module.moduleType === "writing";
                                  const answerMarks = answer.marks_awarded ?? 0;

                                  return (
                                    <div
                                      key={answer.id}
                                      className="border border-slate-200 rounded-lg p-4"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex-1 min-w-[260px]">
                                          <p className="text-sm font-semibold text-slate-700">
                                            Question: {answer.question_ref}
                                          </p>
                                          <div
                                            className={`mt-2 text-sm text-slate-700 rounded-lg border border-slate-100 bg-slate-50 p-3 ${
                                              isWriting
                                                ? "whitespace-pre-line"
                                                : ""
                                            }`}
                                          >
                                            {answer.student_response ||
                                              "No response"}
                                          </div>
                                        </div>

                                        <div className="w-full sm:w-56">
                                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                                            Marks (max {maxMarks})
                                          </label>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              min={0}
                                              max={maxMarks}
                                              step={
                                                module.moduleType === "writing"
                                                  ? 0.5
                                                  : 1
                                              }
                                              value={answerMarks}
                                              onChange={(e) =>
                                                handleMarkChange(
                                                  attempt.attemptId,
                                                  module.attemptModuleId,
                                                  answer.id,
                                                  Number(e.target.value),
                                                )
                                              }
                                              className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 text-sm"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateMark(
                                                  answer.id,
                                                  answer.marks_awarded,
                                                )
                                              }
                                              disabled={savingMarks[answer.id]}
                                              className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                            >
                                              {savingMarks[answer.id]
                                                ? "Saving..."
                                                : "Save"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {filteredReviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No reviews found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
