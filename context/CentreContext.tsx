"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export interface Center {
  center_id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "verified" | "rejected";
  verified_at?: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  completedTests: number;
  totalPapers: number;
  totalMockTestRegistered: number;
}

export interface CentreContextType {
  currentCenter: Center | null;
  allCenters: Center[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isValidCenter: boolean;
  refreshCenters: () => Promise<void>;
  switchCenter: (slug: string) => void;
}

const CentreContext = createContext<CentreContextType | undefined>(undefined);

export function CentreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const supabase = createClient();

  const [currentCenter, setCurrentCenter] = useState<Center | null>(null);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isValidCenter, setIsValidCenter] = useState(false);
  const [slugReady, setSlugReady] = useState(false);

  // Fetch dashboard statistics for a center
  const fetchDashboardStats = async (centerId: string) => {
    try {
      // Fetch total students for this center
      const { count: studentsCount, error: studentsError } = await supabase
        .from("student_profiles")
        .select("student_id", { count: "exact", head: true })
        .eq("center_id", centerId);

      if (studentsError) throw studentsError;

      // Fetch total papers for this center
      const { count: papersCount, error: papersError } = await supabase
        .from("papers")
        .select("id", { count: "exact", head: true })
        .eq("center_id", centerId);

      if (papersError) throw papersError;

      // Fetch completed tests for students in this center
      const { count: completedTests, error: testsError } = await supabase
        .from("mock_attempts")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .in(
          "student_id",
          (
            await supabase
              .from("student_profiles")
              .select("student_id")
              .eq("center_id", centerId)
          ).data?.map((s: any) => s.student_id) || [],
        );

      if (testsError) throw testsError;

      // Fetch total mock attempts for students in this center
      const { count: mockAttemptsCount, error: mockAttemptsError } =
        await supabase
          .from("mock_attempts")
          .select("id", { count: "exact", head: true })
          .in(
            "student_id",
            (
              await supabase
                .from("student_profiles")
                .select("student_id")
                .eq("center_id", centerId)
            ).data?.map((s: any) => s.student_id) || [],
          );

      if (mockAttemptsError) throw mockAttemptsError;

      setDashboardStats({
        totalStudents: studentsCount || 0,
        completedTests: completedTests || 0,
        totalPapers: papersCount || 0,
        totalMockTestRegistered: mockAttemptsCount || 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setDashboardStats({
        totalStudents: 0,
        completedTests: 0,
        totalPapers: 0,
        totalMockTestRegistered: 0,
      });
    }
  };

  // Fetch all centers for the current user and validate against current slug
  const fetchCenters = async (slugToCheck: string | undefined) => {
    // Can't proceed without both user and slug
    if (!user?.id || !slugToCheck) {
      setLoading(false);
      setIsOwner(false);
      setIsValidCenter(false);
      setCurrentCenter(null);
      setDashboardStats(null);
      setError(!slugToCheck ? "No center slug provided" : null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsOwner(false);
      setIsValidCenter(false);

      // Fetch all centers owned by the user
      const { data: centersData, error: centersError } = await supabase
        .from("centers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (centersError) {
        throw centersError;
      }

      setAllCenters(centersData || []);

      // Find center with matching slug
      const center = centersData?.find((c) => c.slug === slugToCheck);

      if (!center) {
        // Not an owner — check if user is a member of any center with this slug
        const { data: centerBySlug } = await supabase
          .from("centers")
          .select("*")
          .eq("slug", slugToCheck)
          .maybeSingle();

        if (centerBySlug) {
          const { data: membership } = await supabase
            .from("center_members")
            .select("membership_id")
            .eq("center_id", centerBySlug.center_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (membership) {
            setCurrentCenter(centerBySlug);
            setIsOwner(false);
            setIsValidCenter(true);
            setError(null);
            await fetchDashboardStats(centerBySlug.center_id);
            setLoading(false);
            return;
          }
        }

        setError("Center not found or access denied");
        setCurrentCenter(null);
        setIsOwner(false);
        setIsValidCenter(false);
        setDashboardStats(null);
        setLoading(false);
        return;
      }

      // Verify ownership
      if (center.user_id !== user.id) {
        setError("Unauthorized: You do not own this center");
        setCurrentCenter(null);
        setIsOwner(false);
        setIsValidCenter(false);
        setDashboardStats(null);
        setLoading(false);
        return;
      }

      // Owner — all checks passed
      setCurrentCenter(center);
      setIsOwner(true);
      setIsValidCenter(true);
      setError(null);

      // Fetch dashboard stats for this center
      await fetchDashboardStats(center.center_id);
    } catch (err) {
      console.error("Error fetching centers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch centers");
      setIsOwner(false);
      setIsValidCenter(false);
      setCurrentCenter(null);
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh centers data
  const refreshCenters = async () => {
    await fetchCenters(slug);
  };

  // Switch to a different center
  const switchCenter = (newSlug: string) => {
    const center = allCenters.find((c) => c.slug === newSlug);
    if (center) {
      setCurrentCenter(center);
      // Note: Navigation should be handled by the component calling this
    }
  };

  // Wait for slug to be ready (useParams might take a moment)
  useEffect(() => {
    if (slug !== undefined) {
      setSlugReady(true);
    }
  }, [slug]);

  // Fetch centers when user is ready and slug is ready
  useEffect(() => {
    if (user?.id && slugReady) {
      fetchCenters(slug);
    } else if (user?.id && !slug) {
      // Slug is explicitly falsy (not just undefined yet), so mark invalid
      setLoading(false);
      setIsValidCenter(false);
      setIsOwner(false);
      setCurrentCenter(null);
      setDashboardStats(null);
    }
  }, [user?.id, slug, slugReady]);

  const value: CentreContextType = {
    currentCenter,
    allCenters,
    dashboardStats,
    loading,
    error,
    isOwner,
    isValidCenter,
    refreshCenters,
    switchCenter,
  };

  return (
    <CentreContext.Provider value={value}>{children}</CentreContext.Provider>
  );
}

export function useCentre() {
  const context = useContext(CentreContext);
  if (context === undefined) {
    throw new Error("useCentre must be used within a CentreProvider");
  }
  return context;
}
