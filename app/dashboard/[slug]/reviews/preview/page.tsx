"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Edit3, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { useParams } from "next/navigation";
import {
  fetchAttemptDetails,
  formatReviewDate,
  formatDurationDetailed,
  getReviewStatusColor,
  PreviewAnswerDetail as AnswerDetail,
  PreviewModuleDetail as ModuleDetail,
  AttemptDetail,
} from "@/helpers/reviews";

export default function PreviewPage() {
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
    void loadAttemptDetails();
  }, [attemptId]);

  const loadAttemptDetails = async () => {
    setLoading(true);
    const data = await fetchAttemptDetails(attemptId!);
    if (data) {
      setAttemptDetail(data);
    }
    setLoading(false);
  };

  const formatDate = formatReviewDate;
  const formatDuration = formatDurationDetailed;
  const getStatusColor = getReviewStatusColor;

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
      {/* Student & Attempt Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
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
            <div className="space-y-2 text-sm">
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
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-2">
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
              </div>
            </button>
          ))}
        </div>

        <Link
          href={`/dashboard/${slug}/reviews/grade?attemptId=${attemptDetail.attemptId}&moduleId=${selectedModule.attemptModuleId}&slug=${slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Grade Module
        </Link>
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
                  {isWriting
                    ? selectedModule.band_score || 0
                    : selectedModule.score_obtained || 0}
                  {selectedModule.band_score && !isWriting && (
                    <span className="text-base text-slate-600 ml-2">
                      (Band {selectedModule.band_score})
                    </span>
                  )}
                  {isWriting && (
                    <span className="text-base text-slate-600 ml-2">
                      (Band {selectedModule.band_score || 0})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Answers Display */}
          {isWriting ? (
            // Writing Module - Show detailed responses
            <div className="space-y-4">
              {selectedModule.answers
                .sort((a, b) => {
                  const numA =
                    parseInt(a.question_ref.replace(/\D/g, ""), 10) || 0;
                  const numB =
                    parseInt(b.question_ref.replace(/\D/g, ""), 10) || 0;
                  return numA - numB;
                })
                .map((answer, index) => (
                  <div
                    key={answer.id}
                    className="border border-slate-200 rounded-lg p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                          {answer.question_ref.replace(/\D/g, "") || index + 1}
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
            // Other Modules - Show table format with two columns
            <div className="grid grid-cols-2 gap-6">
              {(() => {
                const sortedAnswers = selectedModule.answers.sort((a, b) => {
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
                    <div className="overflow-x-auto bg-gray-50 rounded-lg border border-slate-200 p-4">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              #Q
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Student Answer
                            </th>
                            <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Result
                            </th>
                            <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {firstColumn.map((answer) => (
                            <tr
                              key={answer.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
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

                    {/* Second Column */}
                    {secondColumn.length > 0 && (
                      <div className="overflow-x-auto bg-gray-50 rounded-lg border border-slate-200 p-4">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                #Q
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Student Answer
                              </th>
                              <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Result
                              </th>
                              <th className="w-[10%] px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {secondColumn.map((answer) => (
                              <tr
                                key={answer.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
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
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
