"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    window.location.href = "/auth/login";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Loading
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Please wait while we load your account...
        </p>
      </div>
    </div>
  );
}
