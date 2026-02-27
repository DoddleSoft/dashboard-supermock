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
import { useCentre } from "./CentreContext";

// ─── Role types ───────────────────────────────────────────────────────────────

export type CenterRole = "owner" | "admin" | "examiner";

/**
 * The first path in each array is the default landing page for that role.
 * Segments are relative to /dashboard/[slug].
 *   ""              → /dashboard/[slug]          (overview)
 *   "/reviews"      → /dashboard/[slug]/reviews
 *   etc.
 */
const ROLE_ALLOWED_SEGMENTS: Record<CenterRole, string[]> = {
  owner: [
    "",
    "/tests",
    "/questions",
    "/papers",
    "/reviews",
    "/students",
    "/members",
    "/support",
    "/create",
  ],
  admin: [
    "",
    "/tests",
    "/questions",
    "/papers",
    "/reviews",
    "/students",
    "/support",
    "/create",
  ],
  examiner: ["/reviews", "/questions", "/create/modules", "/support"],
};

/** Where each role lands by default when visiting the dashboard root. */
export const ROLE_DEFAULT_SEGMENT: Record<CenterRole, string> = {
  owner: "",
  admin: "",
  examiner: "/reviews",
};

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AccessContextType {
  role: CenterRole | null;
  loading: boolean;
  /** Returns true if the given absolute pathname is accessible for the current role. */
  canAccess: (pathname: string) => boolean;
  /** Allowed path segments (relative to /dashboard/[slug]) for the current role. */
  allowedSegments: string[];
  /** Absolute URL of the default landing page for the current role. */
  defaultPath: string;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentCenter, isOwner, loading: centerLoading } = useCentre();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const supabase = createClient();

  const [role, setRole] = useState<CenterRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until the center is resolved
    if (centerLoading) return;

    if (!user?.id || !currentCenter) {
      setRole(null);
      setLoading(false);
      return;
    }

    if (isOwner) {
      setRole("owner");
      setLoading(false);
      return;
    }

    // Not an owner — look up the user's role in public.users
    const resolveRole = async () => {
      setLoading(true);
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const fetchedRole = profile?.role as CenterRole | null;
      // Only grant "admin" or "examiner"; anything else is denied
      setRole(
        fetchedRole === "admin" || fetchedRole === "examiner"
          ? fetchedRole
          : null,
      );
      setLoading(false);
    };

    resolveRole();
  }, [user?.id, currentCenter?.center_id, isOwner, centerLoading]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const allowedSegments: string[] = role ? ROLE_ALLOWED_SEGMENTS[role] : [];

  const canAccess = (pathname: string): boolean => {
    if (!role || !slug) return false;
    const base = `/dashboard/${slug}`;
    if (!pathname.startsWith(base)) return false;

    const relative = pathname.slice(base.length) || "";

    return allowedSegments.some((seg) => {
      if (seg === "") return relative === "";
      return relative === seg || relative.startsWith(seg + "/");
    });
  };

  const defaultPath = slug
    ? `/dashboard/${slug}${role ? ROLE_DEFAULT_SEGMENT[role] : ""}`
    : "/dashboard";

  return (
    <AccessContext.Provider
      value={{ role, loading, canAccess, allowedSegments, defaultPath }}
    >
      {children}
    </AccessContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
