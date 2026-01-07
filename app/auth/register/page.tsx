"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, Check, Shield } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function Register() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as "admin" | "examiner",
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate full name
    if (formData.fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.fullName.trim(),
        formData.role
      );

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
        return;
      }

      // Always redirect to login after successful registration
      // User will need to verify email and then login
      router.push("/auth/login?registered=true");
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Form Container */}
          <div>
            {error && (
              <div
                className={`mb-4 p-4 border rounded-lg ${
                  error.includes("✅")
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm ${
                    error.includes("✅")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Input */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "admin" }))
                    }
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      formData.role === "admin"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Admin/Owner</div>
                      <div className="text-xs opacity-75">Full control</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, role: "examiner" }))
                    }
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      formData.role === "examiner"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Examiner</div>
                      <div className="text-xs opacity-75">Manage tests</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                  Or
                </span>
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-500">
              By creating an account, you agree to our{" "}
              <Link
                href="#"
                className="underline hover:text-slate-600 dark:hover:text-slate-400"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="underline hover:text-slate-600 dark:hover:text-slate-400"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branded Section */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 -ml-48 -mb-48"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="text-6xl font-bold text-white mb-4">
                <span className="bg-green-500 px-4 py-2 rounded inline-block mr-2">
                  I
                </span>
                <span className="bg-blue-600 px-4 py-2 rounded inline-block mr-2">
                  E
                </span>
                <span className="bg-red-500 px-4 py-2 rounded inline-block mr-2">
                  L
                </span>
                <span className="bg-yellow-400 px-4 py-2 rounded inline-block mr-2">
                  T
                </span>
                <span className="bg-black px-4 py-2 rounded inline-block">
                  S
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Master Your IELTS Test
          </h2>
          <p className="text-blue-100 mb-8 text-lg leading-relaxed">
            Practice with real exam questions, get instant feedback, and track
            your progress. Join thousands of successful test takers.
          </p>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center text-white justify-center gap-3">
              <div className="bg-green-400 rounded-full p-2">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span>Comprehensive Practice Tests</span>
            </div>
            <div className="flex items-center text-white justify-center gap-3">
              <div className="bg-green-400 rounded-full p-2">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span>Expert Feedback & Analysis</span>
            </div>
            <div className="flex items-center text-white justify-center gap-3">
              <div className="bg-green-400 rounded-full p-2">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span>Track Your Progress</span>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-white/80 text-sm mb-2">Success Rate</div>
            <div className="text-4xl font-bold text-white">95%</div>
            <div className="text-white/80 text-sm">
              of students improve their scores
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
