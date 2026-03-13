"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { Student } from "@/types/student";
import { SmallLoader } from "@/components/ui/SmallLoader";

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onActionClick: (student: Student, e: React.MouseEvent) => void;
  showActionMenu: boolean;
  actionMenuStudent: Student | null;
  isDeleting: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onCloseMenu: () => void;
  formatLocalTime: (isoString: string) => string;
  getRelativeTime: (isoString: string) => string;
  // Pagination
  total: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/** Returns an array of page numbers and "…" separators for the paginator. */
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const delta = 1; // neighbours on each side of current
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

export function StudentTable({
  students,
  loading,
  onActionClick,
  showActionMenu,
  actionMenuStudent,
  isDeleting,
  onEdit,
  onDelete,
  onCloseMenu,
  formatLocalTime,
  getRelativeTime,
  total,
  currentPage,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: StudentTableProps) {
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleActionClick = (student: Student, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.min(rect.right - 140, window.innerWidth - 148),
    });
    onActionClick(student, e);
  };

  const handleCloseMenu = () => {
    setMenuPos(null);
    onCloseMenu();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, total);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "passed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "archived":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatStatusLabel = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  if (loading) {
    return <SmallLoader subtitle="Loading students..." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full isolate">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tests
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((student) => (
              <tr
                key={student.student_id}
                className="hover:bg-slate-50 transition-colors duration-150"
              >
                <td className="px-6 py-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900 text-sm">
                      {student.name || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm">
                  {student.email || "N/A"}
                </td>
                <td className="px-6 py-1 text-slate-900 font-medium text-sm">
                  {student.testsCompleted}
                </td>
                <td className="px-6 py-1">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      student.status,
                    )}`}
                  >
                    {formatStatusLabel(student.status)}
                  </span>
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm font-medium">
                  {student.grade || "N/A"}
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm">
                  <span title={formatLocalTime(student.enrolled_at)}>
                    {getRelativeTime(student.enrolled_at)}
                  </span>
                </td>
                <td className="px-6 py-1 text-right">
                  <button
                    onClick={(e) => handleActionClick(student, e)}
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

        {students.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">
              No students found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Action dropdown — rendered with fixed positioning to avoid overflow clipping */}
      {showActionMenu && actionMenuStudent && menuPos && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={handleCloseMenu}
          />
          <div
            className="fixed bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={() => {
                onEdit(actionMenuStudent);
                handleCloseMenu();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(actionMenuStudent);
                handleCloseMenu();
              }}
              disabled={isDeleting}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </>
      )}

      {/* ── Pagination bar ─────────────────────────────────────────────────── */}
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
          {/* Prev */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
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
                onClick={() => onPageChange(p as number)}
                className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                  p === currentPage
                    ? "bg-white border-gray-500 text-blue-500 shadow-sm shadow-blue-200"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                }`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
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
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-10 px-3 pr-7 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
