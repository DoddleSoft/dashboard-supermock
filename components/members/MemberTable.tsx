import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { CenterMember } from "@/types/member";
import { SmallLoader } from "@/components/ui/SmallLoader";

interface MemberTableProps {
  members: CenterMember[];
  loading: boolean;
  onActionClick: (member: CenterMember, e: React.MouseEvent) => void;
  showActionMenu: boolean;
  actionMenuMember: CenterMember | null;
  isDeleting: boolean;
  onEdit: (member: CenterMember) => void;
  onDelete: (member: CenterMember) => void;
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

export function MemberTable({
  members,
  loading,
  onActionClick,
  showActionMenu,
  actionMenuMember,
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
}: MemberTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, total);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "examiner":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getStatusLabel = (isActive: boolean) =>
    isActive ? "Active" : "Inactive";

  if (loading) {
    return <SmallLoader subtitle="Loading members..." />;
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
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.map((member) => (
              <tr
                key={member.user_id}
                className={`hover:bg-slate-50 transition-colors duration-150 relative ${
                  actionMenuMember?.user_id === member.user_id ? "z-40" : "z-0"
                }`}
              >
                <td className="px-6 py-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900 text-sm">
                      {member.full_name || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm">
                  {member.email || "N/A"}
                </td>
                <td className="px-6 py-1">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(
                      member.role,
                    )}`}
                  >
                    {formatRoleLabel(member.role)}
                  </span>
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm font-medium">
                  {getStatusLabel(member.is_active)}
                </td>
                <td className="px-6 py-1 text-slate-600 text-sm">
                  <span title={formatLocalTime(member.joined_at)}>
                    {getRelativeTime(member.joined_at)}
                  </span>
                </td>
                <td className="px-6 py-1 text-right">
                  {member.isOwner ? (
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Owner
                    </span>
                  ) : (
                    <button
                      onClick={(e) => onActionClick(member, e)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}

                  {!member.isOwner &&
                    showActionMenu &&
                    actionMenuMember?.user_id === member.user_id && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-transparent"
                          onClick={onCloseMenu}
                        />
                        <div className="absolute right-10 top-0 mt-10 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                          <button
                            onClick={() => {
                              onEdit(member);
                              onCloseMenu();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onDelete(member);
                              onCloseMenu();
                            }}
                            disabled={isDeleting}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100 disabled:opacity-50"
                          >
                            {isDeleting ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">
              No members found matching your criteria
            </p>
          </div>
        )}
      </div>

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
