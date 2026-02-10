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

        // Fetch user's centers
        const { data: centers, error } = await supabase
          .from("centers")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching centers:", error);
          router.push("/auth/login");
          return;
        }

        // If user has centers, redirect to the first one
        if (centers && centers.length > 0) {
          router.push(`/dashboard/${centers[0].slug}`);
        } else {
          // No centers found, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error in redirect:", error);
        router.push("/auth/login");
      }
    };

    redirectToCenter();
  }, [user, router]);

  return <Loader />;
}
