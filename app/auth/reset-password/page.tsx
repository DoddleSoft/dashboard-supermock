"use client";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BrandedSection } from "@/components/auth/BrandedSection";

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex">
      <ResetPasswordForm />
      <BrandedSection />
    </div>
  );
}
