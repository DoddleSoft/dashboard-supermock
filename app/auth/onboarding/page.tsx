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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
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

  const createCenter = async () => {
    try {
      const { data, error } = await supabase
        .from("centers")
        .insert({
          name: formData.name,
          slug: formData.slug,
          subscription_tier: formData.subscriptionTier,
          is_active: formData.isActive,
          user_id: user?.id, // Add the authenticated user's ID
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error creating center:", error);
      throw error;
    }
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
      // Step 1: Create the center
      const center = await createCenter();

      if (!center || !center.center_id) {
        throw new Error("Failed to create center - no center ID returned");
      }

      console.log("Created center:", center);
      toast.success("Center created successfully!");

      // Step 2: Try to update user profile with center_id, but don't block on failure
      try {
        await supabase.from("users").upsert(
          {
            user_id: user.id,
            center_id: center.center_id,
            email: user.email!,
            role: "admin",
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
            is_active: true,
          },
          {
            onConflict: "user_id",
          }
        );
      } catch (profileError) {
        // Ignore profile update errors - the center was created successfully
        console.log("Profile update skipped (non-critical):", profileError);
      }

      // Step 3: Redirect to dashboard with center slug
      toast.success(`Redirecting to ${center.name}...`);
      router.push(`/dashboard/${center.slug}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Setup Your Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Let's get your testing center up and running
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The official name of your testing center
                </p>
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Center Slug *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="manhattan-test-center"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Auto-generated from center name (URL-friendly, lowercase,
                  hyphens only)
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Activate center immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={!formData.name || !formData.slug || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Center"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          You can update these settings anytime in your center settings
        </p>
      </div>
    </div>
  );
}
