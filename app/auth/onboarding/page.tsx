"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  // Redirect to login if not authenticated (only after loading completes)
  if (!authLoading && !user) {
    router.push("/auth/login");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subscriptionTier: "free",
    isActive: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate form data
    if (!formData.name.trim()) {
      setError("Center name is required");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Center slug is required");
      return;
    }

    // Double check user is still authenticated
    if (!user) {
      setError("Authentication expired. Please login again.");
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create the center (with user_id automatically set)
      const { data: centerData, error: centerError } = await supabase
        .from("centers")
        .insert({
          name: formData.name,
          slug: formData.slug,
          is_active: formData.isActive,
          user_id: user.id,
        })
        .select()
        .single();

      if (centerError) {
        throw centerError;
      }

      if (!centerData) {
        throw new Error("Failed to create center - no data returned");
      }

      console.log("Created center:", centerData);
      toast.success("Center created successfully!");

      // Step 2: Redirect to dashboard with center slug
      toast.success(`Redirecting to ${centerData.name}...`);
      router.push(`/dashboard/${centerData.slug}`);
    } catch (error: any) {
      console.error("Onboarding error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to create center. Please try again.";

      if (
        error?.message?.includes(
          "duplicate key value violates unique constraint"
        )
      ) {
        if (error.message.includes("slug")) {
          errorMessage =
            "A center with this slug already exists. Please choose a different name.";
        } else {
          errorMessage = "A center with this information already exists.";
        }
      } else if (error?.message?.includes("permission denied")) {
        errorMessage =
          "You don't have permission to create a center. Please contact support.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <Building2 className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Your Center
          </h1>
          <p className="text-gray-600">
            Let's get your testing center up and running
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Center Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Manhattan Test Center"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The official name of your testing center
                </p>
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Center Slug *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="manhattan-test-center"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from center name (URL-friendly, lowercase,
                  hyphens only)
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-lg border border-red-200">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Activate center immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={!formData.name || !formData.slug || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? "Creating..." : "Create Center"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          You can update these settings anytime in your center settings
        </p>
      </div>
    </div>
  );
}
