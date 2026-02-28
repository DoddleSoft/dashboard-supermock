"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandedSection } from "@/components/auth/BrandedSection";
import { toast } from "sonner";
import { parseError } from "@/lib/utils";

const hashPasscode = async (passcode: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function ExchangeCodePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Load current session to prefill email
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      setUserEmail(user.email ?? null);
      setEmail(user.email ?? "");
      setSessionLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!passcode.trim()) {
      toast.error("Please enter your passcode");
      return;
    }

    setIsLoading(true);
    const loadingId = toast.loading("Verifying passcode...");

    try {
      const hash = await hashPasscode(passcode.trim());

      const { data, error } = await supabase.rpc("verify_and_join_center", {
        p_passcode_hash: hash,
      });

      if (error) {
        toast.error(error.message || "Verification failed", {
          id: loadingId,
        });
        return;
      }

      const result = data as {
        success: boolean;
        error?: string;
        center_slug?: string;
      };

      if (!result.success) {
        toast.error(result.error || "Invalid or expired passcode", {
          id: loadingId,
        });
        return;
      }

      toast.success("Access granted! Redirecting to your dashboard...", {
        id: loadingId,
      });

      setTimeout(() => {
        router.push(`/dashboard/${result.center_slug}`);
      }, 1000);
    } catch (err) {
      toast.error(
        parseError(
          err,
          "Verification failed. Please check your connection and try again.",
        ),
        {
          id: loadingId,
        },
      );
      console.error("Exchange code error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex">
      {/* Left — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-4">
              <KeyRound className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Enter Your Passcode
            </h1>
            <p className="text-gray-500 text-sm">
              Your centre admin has created an invite for your account. Enter
              the passcode they shared with you to gain access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Signed in as {userEmail}
              </p>
            </div>

            {/* Passcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter passcode provided by your admin"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? "Verifying..." : "Verify & Join Centre"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              Not the right account?
            </p>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out and use a different account
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Need help?{" "}
            <a
              href="mailto:contact@supermock.net"
              className="underline hover:text-gray-700 transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>

      {/* Right — branded section */}
      <BrandedSection />
    </div>
  );
}
