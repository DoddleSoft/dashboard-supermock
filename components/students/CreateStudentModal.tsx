"use client";

import { useState } from "react";
import { X, Search, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CreateStudentModalProps {
  isOpen: boolean;
  formData: {
    student_id: string;
    name: string;
    email: string;
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
  const [emailSearch, setEmailSearch] = useState("");
  const [lookupState, setLookupState] = useState<
    "idle" | "searching" | "found" | "not_found"
  >("idle");
  const [searching, setSearching] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleClose = () => {
    setEmailSearch("");
    setLookupState("idle");
    onClose();
  };

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailSearch.trim().toLowerCase();
    if (!email) return;

    setSearching(true);
    setLookupState("searching");

    try {
      const { data, error } = await supabase
        .from("auth_user_table")
        .select("uid, display_name, email")
        .ilike("email", email)
        .single();

      if (error || !data) {
        setLookupState("not_found");
        return;
      }

      // Pre-fill parent formData with found user info
      onChange("student_id", data.uid);
      onChange("email", data.email ?? email);
      onChange("name", data.display_name ?? "");
      setLookupState("found");
    } catch {
      setLookupState("not_found");
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setEmailSearch("");
    setLookupState("idle");
    onChange("student_id", "");
    onChange("email", "");
    onChange("name", "");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Add Student
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Search by email to find and enroll a student
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Email search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Student Email *
            </label>
            {lookupState === "found" ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800 font-medium flex-1">
                  {formData.email}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={emailSearch}
                    onChange={(e) => {
                      setEmailSearch(e.target.value);
                      if (lookupState !== "idle") setLookupState("idle");
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !emailSearch.trim()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Find"
                  )}
                </button>
              </form>
            )}

            {lookupState === "not_found" && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No account found for this email. The student must register
                first.
              </div>
            )}
          </div>

          {/* Step 2: Full form — only shown after email is found */}
          {lookupState === "found" && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name — pre-filled, editable */}
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
                    onChange={(e) =>
                      onChange("enrollment_type", e.target.value)
                    }
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

                {/* Guardian — required for regular enrollment */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Guardian Name
                    {formData.enrollment_type === "regular" ? " *" : ""}
                  </label>
                  <input
                    type="text"
                    placeholder="Parent/Guardian Name"
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
                  onClick={handleClose}
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
          )}

          {/* Cancel button when form not yet shown */}
          {lookupState !== "found" && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
