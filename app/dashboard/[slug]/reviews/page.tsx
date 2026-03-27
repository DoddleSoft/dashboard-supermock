"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Search, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  formatReviewDate,
  getReviewStatusColor,
  AttemptReview,
} from "@/helpers/reviews";

const PAGE_SIZES = [25, 50, 75, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

/** Returns an array of page numbers and "…" separators for the paginator. */
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const delta = 1;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i > 1 && i < total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function ReviewPage() {
  const { currentCenter } = useCentre();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [reviews, setReviews] = useState<AttemptReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(25);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuAttempt, setActionMenuAttempt] =
    useState<AttemptReview | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<AttemptReview | null>(
    null,
  );
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  // Debounce search — 350 ms (skip initial mount to avoid resetting page)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const id = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Reset to page 1 whenever filters change
  const prevModule = useRef(selectedModule);
  const prevStatus = useRef(selectedStatus);
  useEffect(() => {
    if (
      selectedModule !== prevModule.current ||
      selectedStatus !== prevStatus.current
    ) {
      prevModule.current = selectedModule;
      prevStatus.current = selectedStatus;
      setPage(1);
    }
  }, [selectedModule, selectedStatus]);

  const loadReviews = useCallback(async () => {
    if (!currentCenter?.center_id) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        centerId: currentCenter.center_id,
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        module: selectedModule,
        status: selectedStatus,
      });

      const res = await fetch(`/api/reviews?${params.toString()}`, {
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "Failed to load reviews";
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const body = await res.json();
            if (body.error) message = body.error;
          } catch {
            /* non-JSON despite header */
          }
        }
        throw new Error(message);
      }

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      setReviews(json.reviews);
      setTotal(json.total);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message =
        error instanceof Error ? error.message : "Failed to load reviews";
      toast.error(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    currentCenter?.center_id,
    page,
    limit,
    debouncedSearch,
    selectedModule,
    selectedStatus,
  ]);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadReviews();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadReviews]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);
  const pageNumbers = buildPageNumbers(page, totalPages);

  const handleActionClick = (attempt: AttemptReview, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < menuHeight + 8 ? rect.top - menuHeight - 4 : rect.bottom + 4;
    setMenuPos({
      top,
      left: Math.min(rect.right - 140, window.innerWidth - 148),
    });
    if (actionMenuAttempt?.attemptId === attempt.attemptId) {
      setShowActionMenu((prev) => !prev);
    } else {
      setActionMenuAttempt(attempt);
      setShowActionMenu(true);
    }
  };

  const closeMenu = () => {
    setShowActionMenu(false);
    setShowStatusSubmenu(false);
    setMenuPos(null);
  };

  const handleActionPreview = (attempt: AttemptReview) => {
    setShowActionMenu(false);
    router.push(
      `/dashboard/${slug}/reviews/preview?attemptId=${attempt.attemptId}`,
    );
  };

  const handleActionDelete = (attempt: AttemptReview) => {
    setActionMenuAttempt(null);
    setShowActionMenu(false);
    setAttemptToDelete(attempt);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!attemptToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attemptToDelete.attemptId }),
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to delete review";
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const body = await res.json();
            if (body.error) message = body.error;
          } catch {
            /* non-JSON despite header */
          }
        }
        throw new Error(message);
      }

      if (reviews.length === 1 && page > 1) setPage((p) => p - 1);
      else await loadReviews();
      setShowDeleteConfirm(false);
      setAttemptToDelete(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete review";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAttemptToDelete(null);
  };

  const handleStatusChange = async (
    attempt: AttemptReview,
    newStatus: string,
  ) => {
    if (attempt.status === newStatus) {
      closeMenu();
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.attemptId,
          status: newStatus,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Failed to update status";
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const body = await res.json();
            if (body.error) message = body.error;
          } catch {
            /* non-JSON despite header */
          }
        }
        throw new Error(message);
      }

      // Optimistically update the local review entry
      setReviews((prev) =>
        prev.map((r) =>
          r.attemptId === attempt.attemptId ? { ...r, status: newStatus } : r,
        ),
      );
      toast.success("Status updated");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
      closeMenu();
    }
  };

  const handlePageChange = (newPage: number) => {
    setShowActionMenu(false);
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit as PageSize);
    setPage(1);
    setShowActionMenu(false);
  };

  const formatDate = formatReviewDate;
  const getStatusColor = getReviewStatusColor;

  const formatStatusLabel = (status: string) => {
    return status
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <>
      <div className="max-w-7xl p-6 mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {/* Filters */}
            <div className="flex items-center w-180 gap-3">
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
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
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="evaluated">Evaluated</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <SmallLoader subtitle="Loading reviews..." />}

        {/* Table */}
        {!loading && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full isolate">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Student
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Modules
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reviews.map((attempt) => (
                    <tr
                      key={attempt.attemptId}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="flex flex-col px-6 py-1">
                        <span className="flex flex-col font-medium text-slate-900 text-md">
                          {attempt.studentName || "N/A"}
                        </span>
                        <span className="text-slate-600 text-xs">
                          {attempt.studentEmail || "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-1">
                        <div className="flex flex-wrap gap-1.5">
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
                      <td className="px-6 py-1 text-sm font-semibold text-slate-900">
                        {(() => {
                          const bands = attempt.modules
                            .map((m) => m.band)
                            .filter((b): b is number => b != null);
                          if (bands.length === 0)
                            return <span className="text-slate-400">—</span>;
                          const avg =
                            bands.reduce((a, b) => a + b, 0) / bands.length;
                          return Math.round(avg * 2) / 2;
                        })()}
                      </td>
                      <td className="px-6 py-1">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            attempt.status,
                          )}`}
                        >
                          {formatStatusLabel(attempt.status)}
                        </span>
                      </td>
                      <td className="px-6 py-1 text-slate-600 text-sm">
                        {formatDate(attempt.createdAt)}
                      </td>
                      <td className="px-6 py-1 text-right">
                        <button
                          onClick={(e) => handleActionClick(attempt, e)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900"
                          title="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {reviews.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-slate-500 text-sm">
                    No reviews found matching your criteria
                  </p>
                </div>
              )}
            </div>

            {/* Action dropdown — fixed positioning to avoid overflow clipping */}
            {showActionMenu && actionMenuAttempt && menuPos && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={closeMenu}
                />
                <div
                  className="fixed bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[160px] overflow-visible animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                  style={{ top: menuPos.top, left: menuPos.left }}
                >
                  <button
                    onClick={() => {
                      handleActionPreview(actionMenuAttempt);
                      closeMenu();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    Preview
                  </button>

                  {/* Change Status with click-toggled submenu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusSubmenu((v) => !v)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium border-t border-slate-100 flex items-center justify-between"
                    >
                      Change Status
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showStatusSubmenu ? "-rotate-180" : ""}`}
                      />
                    </button>

                    {showStatusSubmenu && (
                      <div className="absolute right-full top-0 mr-1 bg-white border border-slate-200 rounded-lg shadow-xl min-w-[150px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        {(
                          [
                            {
                              value: "in_progress",
                              label: "In Progress",
                              color: "bg-yellow-500",
                            },
                            {
                              value: "completed",
                              label: "Completed",
                              color: "bg-green-500",
                            },
                            {
                              value: "evaluated",
                              label: "Evaluated",
                              color: "bg-blue-500",
                            },
                            {
                              value: "abandoned",
                              label: "Abandoned",
                              color: "bg-red-500",
                            },
                          ] as const
                        ).map((opt) => {
                          const isCurrent =
                            actionMenuAttempt.status
                              .toLowerCase()
                              .replace(/[\s-]+/g, "_") === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isCurrent || updatingStatus}
                              onClick={() =>
                                handleStatusChange(actionMenuAttempt, opt.value)
                              }
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors font-medium border-b border-slate-50 last:border-0 disabled:cursor-not-allowed ${
                                isCurrent
                                  ? "bg-slate-50 text-slate-400"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${opt.color}`}
                                />
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      handleActionDelete(actionMenuAttempt);
                      closeMenu();
                    }}
                    disabled={deleting}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}

            {/* ── Pagination bar ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-1">
              {/* Results label */}
              <p className="text-sm font-semibold text-slate-700 select-none">
                Results:{" "}
                <span className="font-bold">
                  {firstRow} – {lastRow}
                </span>{" "}
                of <span className="font-bold">{total}</span>
              </p>

              {/* Page number buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 text-sm select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                        p === page
                          ? "bg-white border-gray-500 text-blue-500 shadow-sm shadow-blue-200"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 select-none">Rows</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="h-10 px-3 pr-7 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && attemptToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-red-900 text-center mb-4">
                Delete Review
              </h3>
              <p className="text-sm text-slate-600 text-center mb-6">
                Are you sure you want to delete the review for{" "}
                <span className="font-semibold text-slate-900">
                  {attemptToDelete.studentName}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
