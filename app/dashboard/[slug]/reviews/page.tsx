"use client";

import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { Filter, MoreVertical, Search, Eye, Trash2 } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { SmallLoader } from "@/components/ui/SmallLoader";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchReviews,
  deleteAttempt,
  formatReviewDate,
  formatDuration,
  getReviewStatusColor,
  ReviewAnswerItem as AnswerItem,
  ReviewModuleEntry as ModuleReview,
  AttemptReview,
} from "@/helpers/reviews";

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
    void loadReviews();
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
    const result = await deleteAttempt(attemptId);
    if (result.success) {
      await loadReviews();
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    const data = await fetchReviews(currentCenter!.center_id);
    setReviews(data);
    setLoading(false);
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

  const formatDate = formatReviewDate;
  const getStatusColor = getReviewStatusColor;

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
