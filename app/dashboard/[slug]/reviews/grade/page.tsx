"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Check, X } from "lucide-react";
import Link from "next/link";
import { SmallLoader } from "@/components/ui/SmallLoader";
import {
  fetchGradeModuleDetails,
  saveGrades,
  GradeAnswerDetail as AnswerDetail,
  GradingDecision,
  GradeModuleDetail as ModuleDetail,
} from "@/helpers/reviews";

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

  // Grading decisions map
  const [gradingDecisions, setGradingDecisions] = useState<
    Map<string, GradingDecision>
  >(new Map());

  useEffect(() => {
    if (!attemptId || !moduleId) {
      toast.error("Missing attempt or module information");
      return;
    }
    void loadModuleDetails();
  }, [attemptId, moduleId]);

  const loadModuleDetails = async () => {
    try {
      setLoading(true);
      if (!moduleId) return;
      const detail = await fetchGradeModuleDetails(moduleId);

      if (detail) {
        setModuleDetail(detail);
        setFeedback(detail.feedback || "");
        setBandScore(detail.band_score);

        // Initialize grading decisions from existing marks
        const initialDecisions = new Map<string, GradingDecision>();
        detail.answers.forEach((ans) => {
          if (ans.is_correct !== null) {
            initialDecisions.set(ans.id, {
              answerId: ans.id,
              isCorrect: ans.is_correct,
              marksAwarded: ans.marks_awarded || 0,
            });
          }
        });
        setGradingDecisions(initialDecisions);
      }
    } catch (error: any) {
      console.error("Error loading module details:", error);
      toast.error(
        "Unable to load module details. Please refresh and try again.",
      );
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

  const handleQuickGrade = (answerId: string, isCorrect: boolean) => {
    const maxMarks = moduleDetail?.moduleType === "writing" ? 9 : 1;
    const marks = isCorrect ? maxMarks : 0;

    setGradingDecisions((prev) => {
      const newMap = new Map(prev);
      newMap.set(answerId, {
        answerId,
        isCorrect,
        marksAwarded: marks,
      });
      return newMap;
    });
  };

  const calculateTotalScore = () => {
    if (!moduleDetail) return 0;
    let total = 0;

    moduleDetail.answers.forEach((answer) => {
      const decision = gradingDecisions.get(answer.id);
      if (decision) {
        total += decision.marksAwarded;
      } else if (answer.marks_awarded !== null) {
        total += answer.marks_awarded;
      }
    });

    return total;
  };

  const handleSaveGrades = async () => {
    if (!moduleDetail) return;

    try {
      setSaving(true);

      // Prepare batch update data - ONLY changed questions
      const answersToUpdate = Array.from(gradingDecisions.values()).map(
        (decision) => ({
          id: decision.answerId,
          is_correct: decision.isCorrect,
          marks_awarded: decision.marksAwarded,
        }),
      );

      if (answersToUpdate.length === 0) {
        toast.error("No grades to save. Please grade at least one answer.");
        return;
      }

      // Single RPC call handles everything: updates answers, calculates band, updates module
      if (!moduleId) {
        toast.error(
          "Missing module information. Please go back and try again.",
        );
        return;
      }
      const result = await saveGrades(
        moduleId,
        answersToUpdate,
        feedback || null,
      );

      if (!result) {
        throw new Error("Failed to save grades");
      }

      if (result.module_type === "writing") {
        toast.success(
          `Saved! Task 1: ${result.task1_score}, Task 2: ${result.task2_score} | Band: ${result.band_score}`,
        );
      } else {
        toast.success(
          `Saved ${result.updated_count} answer(s)! Total: ${result.total_score} | Band: ${result.band_score}`,
        );
      }

      // Update local state instead of re-fetching everything
      setModuleDetail((prev) => {
        if (!prev) return prev;
        const updatedAnswers = prev.answers.map((ans) => {
          const decision = gradingDecisions.get(ans.id);
          if (decision) {
            return {
              ...ans,
              is_correct: decision.isCorrect,
              marks_awarded: decision.marksAwarded,
            };
          }
          return ans;
        });
        return {
          ...prev,
          answers: updatedAnswers,
          band_score: result.band_score ?? prev.band_score,
          score_obtained: result.total_score ?? prev.score_obtained,
          feedback: feedback || prev.feedback,
          status: "completed",
        };
      });

      if (result.band_score !== undefined) {
        setBandScore(result.band_score);
      }

      // Clear decisions after successful save
      setGradingDecisions(new Map());
    } catch (error: any) {
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades. Please try again.");
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
  const isReadingOrListening =
    moduleDetail.moduleType === "reading" ||
    moduleDetail.moduleType === "listening";

  // For reading/listening, render table row
  const renderQuestionRow = (answer: AnswerDetail) => {
    const decision = gradingDecisions.get(answer.id);
    const isMarkedCorrect = decision?.isCorrect === true;
    const isMarkedWrong = decision?.isCorrect === false;
    const hasDecision = decision !== undefined;

    return (
      <tr
        key={answer.id}
        className={`hover:bg-slate-50 transition-colors ${
          hasDecision ? (isMarkedCorrect ? "bg-green-50" : "bg-red-50") : ""
        }`}
      >
        <td className="px-4 py-3 text-sm font-medium text-slate-900">
          {answer.question_ref.replace(/\D/g, "") || "-"}
        </td>
        <td className="px-4 py-3 text-sm text-green-700 font-medium">
          {answer.correct_answer || "N/A"}
        </td>
        <td className="px-4 py-3 text-sm text-slate-900">
          {answer.student_response || (
            <span className="text-slate-400 italic">No answer</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => handleQuickGrade(answer.id, true)}
            className={`p-2 rounded-full transition-all ${
              isMarkedCorrect
                ? "bg-green-600 text-white shadow-md scale-110"
                : "bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600"
            }`}
            title="Mark Correct"
          >
            <Check className="w-4 h-4" />
          </button>
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => handleQuickGrade(answer.id, false)}
            className={`p-2 rounded-full transition-all ${
              isMarkedWrong
                ? "bg-red-600 text-white shadow-md scale-110"
                : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600"
            }`}
            title="Mark Wrong"
          >
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

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
          disabled={saving || gradingDecisions.size === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Upload {gradingDecisions.size}{" "}
              {gradingDecisions.size === 1 ? "Change" : "Changes"}
            </>
          )}
        </button>
      </div>

      {/* Grading Interface */}
      {isReadingOrListening ? (
        // Two-column table layout for Reading/Listening
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 capitalize">
              Grade {moduleDetail.moduleType} Answers
            </h2>
            <div className="text-end">
              <p className="text-sm text-slate-600">
                Changed:{" "}
                <span className="font-bold text-blue-600">
                  {gradingDecisions.size}
                </span>{" "}
                / {moduleDetail.answers.length}
              </p>
              <p className="text-xs text-slate-500">
                Only changed answers will be uploaded
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {(() => {
              const sortedAnswers = [...moduleDetail.answers].sort((a, b) => {
                const numA =
                  parseInt(a.question_ref.replace(/\D/g, ""), 10) || 0;
                const numB =
                  parseInt(b.question_ref.replace(/\D/g, ""), 10) || 0;
                return numA - numB;
              });
              const firstColumn = sortedAnswers.slice(0, 20);
              const secondColumn = sortedAnswers.slice(20);

              return (
                <>
                  {/* First Column */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Q
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Correct
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                            Student
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                            <Check className="inline w-5 h-5 text-green-600" />
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                            <X className="inline w-5 h-5 text-red-600" />
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {firstColumn.map(renderQuestionRow)}
                      </tbody>
                    </table>
                  </div>

                  {/* Second Column */}
                  {secondColumn.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Q
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Correct
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                              Student
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                              <Check className="inline w-4 h-4 text-green-600" />
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                              <X className="inline w-4 h-4 text-red-600" />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {secondColumn.map(renderQuestionRow)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        // Writing Module - Original detailed view
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Grade Writing Tasks
            </h2>
            <div className="text-end">
              <p className="text-sm text-slate-600">
                Changed:{" "}
                <span className="font-bold text-blue-600">
                  {gradingDecisions.size}
                </span>{" "}
                / {moduleDetail.answers.length} tasks
              </p>
              <p className="text-xs text-slate-500">
                Band = (Task 1 + 2×Task 2) / 3
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {moduleDetail.answers
              .sort((a, b) => {
                const numA =
                  parseInt(a.question_ref.replace(/\D/g, ""), 10) || 0;
                const numB =
                  parseInt(b.question_ref.replace(/\D/g, ""), 10) || 0;
                return numA - numB;
              })
              .map((answer, index) => {
                const taskNum =
                  parseInt(answer.question_ref.replace(/\D/g, ""), 10) ||
                  index + 1;
                const taskLabel = `Task ${taskNum}`;
                const isTask2 = taskNum === 2;

                return (
                  <div
                    key={answer.id}
                    className="border border-slate-200 rounded-lg p-5"
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm ${
                              isTask2
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {taskLabel}
                            {isTask2 && (
                              <span className="ml-1 text-xs">(2× weight)</span>
                            )}
                          </span>
                          <p className="text-sm font-semibold text-slate-700">
                            Score: 0-9 band scale
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
                            Band Score (0-9)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            step={0.5}
                            value={
                              gradingDecisions.get(answer.id)?.marksAwarded ??
                              answer.marks_awarded ??
                              ""
                            }
                            onChange={(e) => {
                              const value = e.target.value
                                ? parseFloat(e.target.value)
                                : 0;
                              handleQuickGrade(answer.id, value > 0);
                              setGradingDecisions((prev) => {
                                const newMap = new Map(prev);
                                const existing = newMap.get(answer.id);
                                if (existing) {
                                  newMap.set(answer.id, {
                                    ...existing,
                                    marksAwarded: value,
                                  });
                                } else {
                                  newMap.set(answer.id, {
                                    answerId: answer.id,
                                    isCorrect: value > 0,
                                    marksAwarded: value,
                                  });
                                }
                                return newMap;
                              });
                            }}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 text-lg font-semibold"
                            placeholder="0.0"
                          />
                          {isTask2 && (
                            <p className="text-xs text-purple-600 mt-1 font-medium">
                              ⚠️ This task has 2× weight in final calculation
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Feedback Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Module Feedback (Optional)
        </h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide detailed feedback for the student..."
          rows={4}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 resize-none"
        />
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveGrades}
          disabled={saving || gradingDecisions.size === 0}
          className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-lg"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Grades...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Upload {gradingDecisions.size}{" "}
              {gradingDecisions.size === 1 ? "Answer" : "Answers"} & Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
}
