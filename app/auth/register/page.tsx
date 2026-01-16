"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { BrandedSection } from "@/components/auth/BrandedSection";

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex">
      <RegisterForm />
      <BrandedSection />
    </div>
  );
}
