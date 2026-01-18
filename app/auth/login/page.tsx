"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandedSection } from "@/components/auth/BrandedSection";
import { Loader } from "@/components/ui/Loader";

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
    <Suspense fallback={<Loader subtitle="Loading..." />}>
      <LoginPage />
    </Suspense>
  );
}
