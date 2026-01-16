"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandedSection } from "@/components/auth/BrandedSection";

function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex">
      <LoginForm />
      <BrandedSection />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
