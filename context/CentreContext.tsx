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
}

export interface CentreContextType {
  currentCenter: Center | null;
  allCenters: Center[];
  loading: boolean;
  error: string | null;
  refreshCenters: () => Promise<void>;
  switchCenter: (slug: string) => void;
}

const CentreContext = createContext<CentreContextType | undefined>(undefined);

export function CentreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [currentCenter, setCurrentCenter] = useState<Center | null>(null);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all centers for the current user
  const fetchCenters = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

      // Set current center based on slug
      if (slug && centersData) {
        const center = centersData.find((c) => c.slug === slug);
        if (center) {
          setCurrentCenter(center);
        } else {
          setError("Center not found");
        }
      } else if (centersData && centersData.length > 0) {
        // If no slug, set the first center as current
        setCurrentCenter(centersData[0]);
      }
    } catch (err) {
      console.error("Error fetching centers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch centers");
    } finally {
      setLoading(false);
    }
  };

  // Refresh centers data
  const refreshCenters = async () => {
    await fetchCenters();
  };

  // Switch to a different center
  const switchCenter = (newSlug: string) => {
    const center = allCenters.find((c) => c.slug === newSlug);
    if (center) {
      setCurrentCenter(center);
      // Note: Navigation should be handled by the component calling this
    }
  };

  // Fetch centers when user changes or slug changes
  useEffect(() => {
    if (user?.id) {
      fetchCenters();
    } else {
      setCurrentCenter(null);
      setAllCenters([]);
      setLoading(false);
    }
  }, [user?.id, slug]);

  const value: CentreContextType = {
    currentCenter,
    allCenters,
    loading,
    error,
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
