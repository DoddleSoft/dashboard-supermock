"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        return;
      }

      toast.success("Password updated successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Set New Password
          </h1>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {formData.password.length >= 8 &&
            formData.confirmPassword === formData.password && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Passwords match</span>
              </div>
            )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link
              href="/auth/login"
              className="text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
