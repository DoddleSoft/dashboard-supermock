import { X } from "lucide-react";

interface CreateMemberModalProps {
  isOpen: boolean;
  formData: {
    full_name: string;
    email: string;
    role: "admin" | "examiner";
    passcode: string;
  };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
}

export function CreateMemberModal({
  isOpen,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: CreateMemberModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <p className="text-lg text-slate-500 mt-1">
              Add a new center member
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="Jane Doe"
              value={formData.full_name}
              onChange={(e) => onChange("full_name", e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) => onChange("email", e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                onChange("role", e.target.value as "admin" | "examiner")
              }
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm"
            >
              <option value="admin">Admin</option>
              <option value="examiner">Examiner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passcode *
            </label>
            <input
              type="password"
              placeholder="Set a member passcode"
              value={formData.passcode}
              onChange={(e) => onChange("passcode", e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Add Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
