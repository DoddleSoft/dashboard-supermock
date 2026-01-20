import { MoreVertical } from "lucide-react";
import { Student } from "@/types/student";
import { SmallLoader } from "@/components/ui/SmallLoader";

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onActionClick: (student: Student, e: React.MouseEvent) => void;
  showActionMenu: boolean;
  actionMenuStudent: Student | null;
  menuPosition: { top: number; right: number };
  isDeleting: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onCloseMenu: () => void;
  formatLocalTime: (isoString: string) => string;
  getRelativeTime: (isoString: string) => string;
}

export function StudentTable({
  students,
  loading,
  onActionClick,
  showActionMenu,
  actionMenuStudent,
  menuPosition,
  isDeleting,
  onEdit,
  onDelete,
  onCloseMenu,
  formatLocalTime,
  getRelativeTime,
}: StudentTableProps) {
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

  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SmallLoader subtitle="Loading students..." />
    );
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
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {student.name?.charAt(0) || "?"}
                  </div>
                  <span className="font-medium text-slate-900 text-sm">
                    {student.name || "N/A"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm">
                {student.email || "N/A"}
              </td>
              <td className="px-6 py-4 text-slate-900 font-medium text-sm">
                {student.testsCompleted}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                    student.status
                  )}`}
                >
                  {formatStatusLabel(student.status)}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                {student.grade || "N/A"}
              </td>
              <td className="px-6 py-4 text-slate-600 text-sm">
                <span title={formatLocalTime(student.enrolled_at)}>
                  {getRelativeTime(student.enrolled_at)}
                </span>
              </td>
              <td className="px-6 py-4 text-right relative">
                <button
                  onClick={(e) => onActionClick(student, e)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900"
                  title="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Action Menu */}
                {showActionMenu &&
                  actionMenuStudent?.student_id === student.student_id && (
                    <>
                      {/* Menu backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={onCloseMenu}
                      />

                      {/* Dropdown menu */}
                      <div
                        className="fixed bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                          top: `${menuPosition.top}px`,
                          right: `${menuPosition.right}px`,
                        }}
                      >
                        <button
                          onClick={() => onEdit(student)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(student)}
                          disabled={isDeleting}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 font-medium border-t border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
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
  );
}
