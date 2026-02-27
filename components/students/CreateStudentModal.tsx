"use client";

import { Loader2, X } from "lucide-react";

interface CreateStudentModalProps {
  isOpen: boolean;
  formData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    guardian: string;
    guardian_phone: string;
    date_of_birth: string;
    address: string;
    enrollment_type: string;
  };
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (field: string, value: string) => void;
}

export function CreateStudentModal({
  isOpen,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: CreateStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Add Student
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              A verified account will be created automatically for the student.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Email + Password row */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student Email *
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => onChange("email", e.target.value)}
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Password — 8-digit numeric PIN */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *{" "}
                <span className="text-slate-400 font-normal">
                  (8 digits, numbers only)
                </span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  onChange(
                    "password",
                    e.target.value.replace(/\D/g, "").slice(0, 8),
                  )
                }
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">
                The student will use this to log in on the exam portal.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Enrollment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Enrollment Type *
              </label>
              <select
                value={formData.enrollment_type}
                onChange={(e) => onChange("enrollment_type", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm"
              >
                <option value="regular">Regular</option>
                <option value="mock_only">Mock Only</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+880 1234-567890"
                value={formData.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => onChange("date_of_birth", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 text-sm"
              />
            </div>

            {/* Guardian â€” required for regular enrollment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Guardian Name
                {formData.enrollment_type === "regular" ? " *" : ""}
              </label>
              <input
                type="text"
                placeholder="Parent / Guardian Name"
                value={formData.guardian}
                onChange={(e) => onChange("guardian", e.target.value)}
                required={formData.enrollment_type === "regular"}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Guardian Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                placeholder="+880 1234-567890"
                value={formData.guardian_phone}
                onChange={(e) => onChange("guardian_phone", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address
            </label>
            <textarea
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => onChange("address", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm resize-none"
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
