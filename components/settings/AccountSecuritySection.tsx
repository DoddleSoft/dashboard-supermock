"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AccountSecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to change password.");
        return;
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Account & Security
        </h3>
        <p className="text-sm text-slate-500">
          Update your password to keep your account secure.
        </p>
      </div>

      <div className="max-w-md space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Change Password
          </h4>
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Must be at least 8 characters.
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full pl-10 pr-12 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        {newPassword && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => {
                const strength =
                  (newPassword.length >= 8 ? 1 : 0) +
                  (/[A-Z]/.test(newPassword) ? 1 : 0) +
                  (/[0-9]/.test(newPassword) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                return (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= strength
                        ? strength <= 1
                          ? "bg-red-500"
                          : strength <= 2
                            ? "bg-yellow-500"
                            : strength <= 3
                              ? "bg-blue-500"
                              : "bg-green-500"
                        : "bg-slate-200"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              Use uppercase, numbers, and special characters for a stronger
              password.
            </p>
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50 mt-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Change Password
        </button>
      </div>
    </div>
  );
}
