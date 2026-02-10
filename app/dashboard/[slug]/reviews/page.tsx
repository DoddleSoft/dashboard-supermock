"use client";

import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { Filter, MoreVertical, Search, Eye, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCentre } from "@/context/CentreContext";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { toast } from "sonner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type AnswerItem = {
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
  status: string;
  createdAt: string | null;
  modules: ModuleReview[];
};

export default function ReviewPage() {
  const { currentCenter } = useCentre();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AttemptReview[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentCenter?.center_id) return;
    void fetchReviews();
  }, [currentCenter?.center_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Are you sure you want to delete this attempt?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("mock_attempts")
        .delete()
        .eq("id", attemptId);
      if (error) throw error;
      toast.success("Attempt deleted successfully");
      await fetchReviews();
    } catch (error: any) {
      console.error("Error deleting attempt:", error);
      toast.error("Failed to delete attempt");
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // First, get all attempt_modules for this center
      const { data: attemptModulesData, error: amError } = await supabase
        .from("attempt_modules")
        .select(
          `id,attempt_id,status,score_obtained,band_score,time_spent_seconds,completed_at,module_id,module_type,
          modules!inner (id,module_type,heading,paper_id,center_id),
          mock_attempts (id,student_id,status,created_at,completed_at)`,
        )
        .eq("modules.center_id", currentCenter!.center_id)
        .order("created_at", { ascending: false });

      if (amError) throw amError;

      if (!attemptModulesData || attemptModulesData.length === 0) {
        setReviews([]);
        return;
      }

      // Get all attempt_module IDs
      const attemptModuleIds = attemptModulesData.map((am: any) => am.id);

      // Fetch all student answers for these modules
      const { data: answersData, error: answersError } = await supabase
        .from("student_answers")
        .select(
          "id,attempt_module_id,reference_id,question_ref,student_response,is_correct,marks_awarded,created_at",
        )
        .in("attempt_module_id", attemptModuleIds)
        .order("created_at", { ascending: false });

      if (answersError) throw answersError;

      const attemptMap = new Map<string, AttemptReview>();
      const studentIds = new Set<string>();
      const paperIds = new Set<string>();
      const moduleMap = new Map<string, any>(); // Map attempt_module_id to module data

      // First, process attempt modules to build the structure
      (attemptModulesData || []).forEach((attemptModule: any) => {
        const attemptId = attemptModule.attempt_id;
        const mockAttempt = Array.isArray(attemptModule.mock_attempts)
          ? attemptModule.mock_attempts[0]
          : attemptModule.mock_attempts;
        const moduleInfo = Array.isArray(attemptModule.modules)
          ? attemptModule.modules[0]
          : attemptModule.modules;

        if (!attemptId || !moduleInfo) return;

        // Store module info for later
        moduleMap.set(attemptModule.id, {
          attemptModule,
          mockAttempt,
          moduleInfo,
        });

        // Collect IDs for batch fetching
        if (mockAttempt?.student_id) {
          studentIds.add(mockAttempt.student_id);
        }
        if (moduleInfo?.paper_id) {
          paperIds.add(moduleInfo.paper_id);
        }

        // Get or create attempt entry
        if (!attemptMap.has(attemptId)) {
          attemptMap.set(attemptId, {
            attemptId: attemptId,
            studentId: mockAttempt?.student_id || null,
            studentName: "Loading...",
            studentEmail: "",
            status: mockAttempt?.status || "unknown",
            createdAt: mockAttempt?.created_at || null,
            modules: [],
          });
        }

        const attempt = attemptMap.get(attemptId)!;

        // Add module entry
        const moduleEntry: ModuleReview = {
          attemptModuleId: attemptModule.id,
          moduleType:
            attemptModule.module_type || moduleInfo.module_type || "unknown",
          heading: moduleInfo.heading,
          status: attemptModule.status,
          score: attemptModule.score_obtained,
          band: attemptModule.band_score,
          timeSpentSeconds: attemptModule.time_spent_seconds,
          completedAt: attemptModule.completed_at,
          answers: [],
        };
        attempt.modules.push(moduleEntry);
      });

      // Now process answers and add them to the correct modules
      (answersData || []).forEach((answer: any) => {
        const moduleData = moduleMap.get(answer.attempt_module_id);
        if (!moduleData) return;

        const { attemptModule, mockAttempt, moduleInfo } = moduleData;
        const attemptId = attemptModule.attempt_id;

        const attempt = attemptMap.get(attemptId);
        if (!attempt) return;

        // Find the module entry
        const moduleEntry = attempt.modules.find(
          (m) => m.attemptModuleId === answer.attempt_module_id,
        );

        if (!moduleEntry) return;

        // Add answer to module
        const answerItem: AnswerItem = {
          id: answer.id,
          attempt_module_id: answer.attempt_module_id,
          reference_id: answer.reference_id,
          question_ref: answer.question_ref,
          student_response: answer.student_response,
          is_correct: answer.is_correct,
          marks_awarded: answer.marks_awarded,
          created_at: answer.created_at,
          attempt_modules: {
            id: attemptModule.id,
            attempt_id: attemptModule.attempt_id,
            status: attemptModule.status,
            score_obtained: attemptModule.score_obtained,
            band_score: attemptModule.band_score,
            time_spent_seconds: attemptModule.time_spent_seconds,
            completed_at: attemptModule.completed_at,
            module_id: attemptModule.module_id,
            modules: [moduleInfo],
            mock_attempts: mockAttempt ? [mockAttempt] : [],
          },
        };
        moduleEntry.answers.push(answerItem);
      });

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
            const paperId = (
              module.answers[0].attempt_modules.modules as any
            )?.[0]?.paper_id;
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
        attempt.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());

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
                      <div
                        className="relative"
                        ref={
                          openDropdown === attempt.attemptId
                            ? dropdownRef
                            : null
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown((prev) =>
                              prev === attempt.attemptId
                                ? null
                                : attempt.attemptId,
                            )
                          }
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-600" />
                        </button>
                        {openDropdown === attempt.attemptId && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                            <button
                              onClick={() => {
                                router.push(
                                  `/dashboard/${slug}/reviews/preview?attemptId=${attempt.attemptId}`,
                                );
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                              Preview
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteAttempt(attempt.attemptId);
                                setOpenDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
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
