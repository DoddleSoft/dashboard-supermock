import { MoreVertical } from "lucide-react";
import { CenterMember } from "@/types/member";
import { SmallLoader } from "@/components/ui/SmallLoader";

interface MemberTableProps {
  members: CenterMember[];
  loading: boolean;
  onActionClick: (member: CenterMember, e: React.MouseEvent) => void;
  showActionMenu: boolean;
  actionMenuMember: CenterMember | null;
  menuPosition: { top: number; right: number };
  isDeleting: boolean;
  onEdit: (member: CenterMember) => void;
  onDelete: (member: CenterMember) => void;
  onCloseMenu: () => void;
  formatLocalTime: (isoString: string) => string;
  getRelativeTime: (isoString: string) => string;
}

export function MemberTable({
  members,
  loading,
  onActionClick,
  showActionMenu,
  actionMenuMember,
  menuPosition,
  isDeleting,
  onEdit,
  onDelete,
  onCloseMenu,
  formatLocalTime,
  getRelativeTime,
}: MemberTableProps) {
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full">
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
              className="hover:bg-slate-50 transition-colors duration-150"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {member.full_name?.charAt(0) || "?"}
                  </div>
                  <span className="font-medium text-slate-900 text-sm">
                    {member.full_name || "N/A"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm">
                {member.email || "N/A"}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(
                    member.role,
                  )}`}
                >
                  {formatRoleLabel(member.role)}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                {getStatusLabel(member.is_active)}
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm">
                <span title={formatLocalTime(member.joined_at)}>
                  {getRelativeTime(member.joined_at)}
                </span>
              </td>
              <td className="px-6 py-4 text-right relative">
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
                        className="fixed inset-0 z-40"
                        onClick={onCloseMenu}
                      />

                      <div
                        className="fixed bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                          top: `${menuPosition.top}px`,
                          right: `${menuPosition.right}px`,
                        }}
                      >
                        <button
                          onClick={() => onEdit(member)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(member)}
                          disabled={isDeleting}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 font-medium border-t border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
