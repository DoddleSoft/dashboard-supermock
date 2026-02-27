"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/Loader";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export default function DashboardRedirect() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const redirectToCenter = async () => {
      // If no user, redirect to login
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        const supabase = createClient();

        // Check owned centers first
        const { data: centers, error } = await supabase
          .from("centers")
          .select("slug")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching centers:", error);
        }

        if (centers?.slug) {
          router.push(`/dashboard/${centers.slug}`);
          return;
        }

        // Not an owner — check if they're a member of any active center
        const { data: membership } = await supabase
          .from("center_members")
          .select("center_id, centers(slug, is_active)")
          .eq("user_id", user.id)
          .order("invited_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membership?.centers) {
          const center = Array.isArray(membership.centers)
            ? membership.centers[0]
            : membership.centers;
          if ((center as any)?.is_active && (center as any)?.slug) {
            router.push(`/dashboard/${(center as any).slug}`);
            return;
          }
        }

        // No center found at all
        router.push("/auth/login");
      } catch (error) {
        console.error("Error in redirect:", error);
        router.push("/auth/login");
      }
    };

    redirectToCenter();
  }, [user, router]);

  return <Loader />;
}
