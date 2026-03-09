"use client";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { BrandedSection } from "@/components/auth/BrandedSection";

export default function ChangePassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex">
      <ChangePasswordForm />
      <BrandedSection />
    </div>
  );
}
