import { X } from "lucide-react";
import { Student } from "@/types/student";

interface EditStudentDrawerProps {
  isOpen: boolean;
  student: Student | null;
  editData: {
    name: string;
    email: string;
    phone: string;
    guardian: string;
    guardian_phone: string;
    date_of_birth: string;
    address: string;
    grade: string;
    status: "active" | "cancelled" | "archived" | "passed";
  };
  isSubmitting: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onChange: (field: string, value: string) => void;
  formatLocalTime: (isoString: string) => string;
}

export function EditStudentDrawer({
  isOpen,
  student,
  editData,
  isSubmitting,
  isDeleting,
  onClose,
  onSave,
  onDelete,
  onChange,
  formatLocalTime,
}: EditStudentDrawerProps) {
  if (!isOpen || !student) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-xl bg-white shadow-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200">
          <div>
            <p className="text-sm font-bold uppercase text-slate-800 mt-1">
              Update student information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={editData.date_of_birth}
              onChange={(e) => onChange("date_of_birth", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Guardian Name
            </label>
            <input
              type="text"
              value={editData.guardian}
              onChange={(e) => onChange("guardian", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Guardian Phone
            </label>
            <input
              type="tel"
              value={editData.guardian_phone}
              onChange={(e) => onChange("guardian_phone", e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address
            </label>
            <textarea
              value={editData.address}
              onChange={(e) => onChange("address", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grade
            </label>
            <input
              type="text"
              value={editData.grade}
              onChange={(e) => onChange("grade", e.target.value)}
              placeholder="e.g., 6, 6.5, 7.5"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={editData.status}
              onChange={(e) =>
                onChange(
                  "status",
                  e.target.value as
                    | "active"
                    | "cancelled"
                    | "archived"
                    | "passed"
                )
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm"
            >
              <option value="active">Active</option>
              <option value="passed">Passed</option>
              <option value="archived">Archived</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Read-only fields */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Additional Information
            </p>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Enrolled At</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatLocalTime(student.enrolled_at)}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatLocalTime(student.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t flex border-slate-200 p-6 space-x-3">
          <button
            onClick={onDelete}
            disabled={isDeleting || isSubmitting}
            className="w-full px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              "Delete Student"
            )}
          </button>
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
