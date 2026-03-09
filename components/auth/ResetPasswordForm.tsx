"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { authService } from "@/helpers/auth";
import { toast } from "sonner";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // if (!captchaToken) {
    //   toast.error("Please complete the CAPTCHA verification.");
    //   return;
    // }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(email);

      if (!result.success) {
        toast.error(result.error || "Failed to send reset link.");
        turnstileRef.current?.reset();
        // setCaptchaToken(null);
        return;
      }

      setSent(true);
      toast.success("Password reset link sent! Check your email.");
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
            Reset Password
          </h1>
          <p className="text-gray-600 font-semibold">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
            <p className="text-green-800 font-semibold">Reset link sent!</p>
            <p className="text-sm text-green-700">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-semibold">{email}</span>. Please check your
              inbox and click the link to set a new password.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
                turnstileRef.current?.reset();
                // setCaptchaToken(null);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Send again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                We&apos;ll send a password reset link to this email address.
              </p>
            </div>

            {/* <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            /> */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
