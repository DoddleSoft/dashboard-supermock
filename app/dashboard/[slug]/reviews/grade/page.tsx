"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Check, X } from "lucide-react";
import Link from "next/link";
import { SmallLoader } from "@/components/ui/SmallLoader";

type AnswerDetail = {
  id: string;
  question_ref: string;
  student_response: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  reference_id: string;
  correct_answer?: string;
};

type GradingDecision = {
  answerId: string;
  isCorrect: boolean;
  marksAwarded: number;
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

  // Grading decisions map
  const [gradingDecisions, setGradingDecisions] = useState<
    Map<string, GradingDecision>
  >(new Map());

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

      if (moduleError) {
        console.error("Module fetch error:", moduleError);
        throw moduleError;
      }

      if (!moduleData) {
        throw new Error("No module data found");
      }

      // Fetch student details
      const mockAttempt = Array.isArray(moduleData.mock_attempts)
        ? moduleData.mock_attempts[0]
        : moduleData.mock_attempts;
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

      // Fetch paper title
      const moduleInfo = Array.isArray(moduleData.modules)
        ? moduleData.modules[0]
        : moduleData.modules;
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

      // Fetch answers first
      const { data: answersData, error: answersError } = await supabase
        .from("student_answers")
        .select(
          "id, question_ref, student_response, marks_awarded, is_correct, reference_id",
        )
        .eq("attempt_module_id", moduleId)
        .order("question_ref");

      if (answersError) {
        console.error("Answers fetch error:", answersError);
        throw answersError;
      }

      console.log("Fetched student answers:", answersData?.length || 0);
      if (answersData && answersData.length > 0) {
        console.log("Sample answer with reference_id:", {
          question_ref: answersData[0].question_ref,
          reference_id: answersData[0].reference_id,
        });
      }

      // Get the actual module_id and attempt_id from the fetched data
      const actualModuleId = moduleData.module_id;
      const actualAttemptId = moduleData.attempt_id;

      console.log("Fetching questions using RPC with:", {
        attemptId: actualAttemptId,
        moduleId: actualModuleId,
      });

      // Use RPC to fetch questions with proper permissions
      const { data: questionsData, error: questionsError } = await supabase.rpc(
        "get_module_questions_for_view",
        {
          p_attempt_id: actualAttemptId,
          p_module_id: actualModuleId,
        },
      );

      if (questionsError) {
        console.error("RPC questions fetch error:", questionsError);
        throw questionsError;
      }

      console.log("RPC returned questions:", questionsData?.length || 0);

      // Build questions map from RPC results - map by question_ref
      let questionsMap = new Map();
      if (questionsData && questionsData.length > 0) {
        console.log("✓ Fetched questions via RPC:", questionsData.length);
        console.log("Sample question from RPC:", questionsData[0]);
        console.log(
          "Sample correct_answers field:",
          questionsData[0]?.correct_answers,
        );

        questionsData.forEach((q: any) => {
          // Map by question_ref to match with student_answers
          questionsMap.set(q.question_ref, {
            id: q.question_id,
            correct_answers: q.correct_answers,
            marks: q.marks,
            question_ref: q.question_ref,
          });
        });

        console.log(
          "Questions map keys (question_refs):",
          Array.from(questionsMap.keys()).slice(0, 5),
        );
      } else {
        console.warn("No questions returned from RPC");
      }

      // Process answers to extract correct answer - match by question_ref
      const processedAnswers = (answersData || []).map((ans: any) => {
        let correctAnswer = "N/A";
        try {
          // Match by question_ref field, not reference_id
          const question = questionsMap.get(ans.question_ref);

          if (!question) {
            console.warn(
              `No question found for question_ref: ${ans.question_ref}`,
            );
          } else {
            const correctAnswersData = question.correct_answers;
            console.log(
              `✓ Q${ans.question_ref}: Found match, correct_answers =`,
              correctAnswersData,
            );

            // Handle different formats of correct_answers
            if (typeof correctAnswersData === "string") {
              correctAnswer = correctAnswersData;
            } else if (correctAnswersData?.answer) {
              correctAnswer = correctAnswersData.answer;
            } else if (Array.isArray(correctAnswersData)) {
              correctAnswer = correctAnswersData.join(", ");
            } else if (
              correctAnswersData &&
              typeof correctAnswersData === "object"
            ) {
              // Extract value from object
              const values = Object.values(correctAnswersData).filter(
                (v) => v !== null && v !== undefined,
              );
              correctAnswer = values.join(", ") || "N/A";
            }

            // Clean up empty or whitespace-only answers
            if (!correctAnswer || correctAnswer.trim() === "") {
              correctAnswer = "N/A";
            }
          }
        } catch (e) {
          console.error("Error processing correct answer:", e);
          correctAnswer = "N/A";
        }

        return {
          id: ans.id,
          question_ref: ans.question_ref,
          student_response: ans.student_response,
          marks_awarded: ans.marks_awarded,
          is_correct: ans.is_correct,
          reference_id: ans.reference_id,
          correct_answer: correctAnswer,
        };
      });

      console.log("Processed answers - first 3 with correct answers:");
      processedAnswers.slice(0, 3).forEach((ans) => {
        console.log(`Q${ans.question_ref}: ${ans.correct_answer}`);
      });

      const detail: ModuleDetail = {
        attemptModuleId: moduleData.id,
        moduleType: moduleInfo?.module_type || "unknown",
        heading: moduleInfo?.heading || null,
        status: moduleData.status,
        feedback: moduleData.feedback,
        band_score: moduleData.band_score,
        score_obtained: moduleData.score_obtained,
        answers: processedAnswers,
        studentName,
        studentEmail,
        paperTitle,
      };

      setModuleDetail(detail);
      setFeedback(detail.feedback || "");
      setBandScore(detail.band_score);

      // Initialize grading decisions from existing marks
      const initialDecisions = new Map<string, GradingDecision>();
      processedAnswers.forEach((ans) => {
        if (ans.is_correct !== null) {
          initialDecisions.set(ans.id, {
            answerId: ans.id,
            isCorrect: ans.is_correct,
            marksAwarded: ans.marks_awarded || 0,
          });
        }
      });
      setGradingDecisions(initialDecisions);
    } catch (error: any) {
      console.error("Error loading module details:", error);
      toast.error(
        "Failed to load module details: " + (error.message || "Unknown error"),
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
      const supabase = createClient();

      const isWriting = moduleDetail.moduleType === "writing";

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

      console.log(
        `Uploading ${answersToUpdate.length} changed answer(s) to database...`,
      );
      console.log("Sample update:", answersToUpdate[0]);

      if (isWriting) {
        // Handle writing module with weighted band calculation
        // Task 1 and Task 2 should be in the answers
        const task1Answer = moduleDetail.answers.find(
          (a) =>
            a.question_ref.toLowerCase().includes("task 1") ||
            a.question_ref === "1",
        );
        const task2Answer = moduleDetail.answers.find(
          (a) =>
            a.question_ref.toLowerCase().includes("task 2") ||
            a.question_ref === "2",
        );

        const task1Decision = task1Answer
          ? gradingDecisions.get(task1Answer.id)
          : null;
        const task2Decision = task2Answer
          ? gradingDecisions.get(task2Answer.id)
          : null;

        const task1Score =
          task1Decision?.marksAwarded ?? task1Answer?.marks_awarded ?? 0;
        const task2Score =
          task2Decision?.marksAwarded ?? task2Answer?.marks_awarded ?? 0;

        // Calculate weighted band: (Task1 + 2×Task2) / 3, rounded to nearest 0.5
        const rawBand = (task1Score + 2 * task2Score) / 3;
        const calculatedBand = Math.round(rawBand * 2) / 2; // Round to nearest 0.5

        console.log(
          `Writing Band Calculation: (${task1Score} + 2×${task2Score}) / 3 = ${rawBand.toFixed(2)} → ${calculatedBand}`,
        );

        // Update individual task scores in student_answers
        for (const answer of answersToUpdate) {
          const { error: updateError } = await supabase
            .from("student_answers")
            .update({
              marks_awarded: answer.marks_awarded,
              is_correct: answer.is_correct,
            })
            .eq("id", answer.id);

          if (updateError) throw updateError;
        }

        // Update module with calculated band score
        const { error: moduleError } = await supabase
          .from("attempt_modules")
          .update({
            band_score: calculatedBand,
            score_obtained: task1Score + task2Score, // Total raw score
            feedback: feedback || null,
            status: "graded",
          })
          .eq("id", moduleId);

        if (moduleError) throw moduleError;

        console.log("✓ Writing module graded successfully");
        toast.success(
          `Saved! Task 1: ${task1Score}, Task 2: ${task2Score} | Band: ${calculatedBand}`,
        );
      } else {
        // Reading/Listening: Use RPC for batch update with auto band calculation
        const { data, error } = await supabase.rpc("batch_update_grades", {
          p_module_id: moduleId,
          p_answers: answersToUpdate,
          p_feedback: feedback || null,
        });

        if (error) {
          console.error("RPC error:", error);
          throw error;
        }

        console.log("✓ Batch update successful:", data);
        toast.success(
          `Saved ${answersToUpdate.length} answer(s)! Total: ${data.total_score} | Band: ${data.band_score}`,
        );
      }

      // Refresh data
      await fetchModuleDetails();

      // Clear decisions after successful save
      setGradingDecisions(new Map());
    } catch (error: any) {
      console.error("Error saving grades:", error);
      toast.error("Failed to save grades: " + error.message);
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
