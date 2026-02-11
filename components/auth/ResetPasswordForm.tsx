"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { authService } from "@/helpers/auth";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmCurrentPassword, setShowConfirmCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    confirmCurrentPassword: "",
    newPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate current password length
    if (formData.currentPassword.length < 6) {
      setError("Current password must be at least 6 characters");
      return;
    }

    // Validate current passwords match
    if (formData.currentPassword !== formData.confirmCurrentPassword) {
      setError("Current passwords do not match");
      return;
    }

    // Validate new password length
    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    // Validate that new password is different from current
    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      // First, authenticate the user with their email and current password
      const signInResult = await authService.login({
        email: formData.email,
        password: formData.currentPassword,
      });

      if (!signInResult.success) {
        setError(
          "Invalid email or current password. Please check your credentials.",
        );
        toast.error("Invalid email or current password");
        setIsLoading(false);
        return;
      }

      // Now update the password
      const updateResult = await authService.updatePassword(
        formData.newPassword,
      );

      if (!updateResult.success) {
        setError(
          updateResult.error || "Failed to update password. Please try again.",
        );
        toast.error(updateResult.error || "Failed to update password");
        setIsLoading(false);
        return;
      }

      toast.success(
        "Password updated successfully! Please login with your new password.",
      );

      // Clear form
      setFormData({
        email: "",
        currentPassword: "",
        confirmCurrentPassword: "",
        newPassword: "",
      });

      // Sign out the user and redirect to login
      await authService.signOut();

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      const errorMsg = "An unexpected error occurred. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Password reset error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-md text-gray-500">
            Remember your password?{" "}
            <span className="text-red-600">
              <Link href="/auth/login" className="underline">
                Log in
              </Link>
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 text-gray-900 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="confirmCurrentPassword"
                type={showConfirmCurrentPassword ? "text" : "password"}
                placeholder="Re-enter your current password"
                value={formData.confirmCurrentPassword}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmCurrentPassword(!showConfirmCurrentPassword)
                }
                className="absolute right-3 top-3 text-gray-400"
              >
                {showConfirmCurrentPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                className="w-full pl-10 text-gray-900 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
