import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAllowedPath,
  ROLE_DEFAULT_SEGMENT,
  type CenterRole,
} from "@/lib/access-control";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

type CenterAccess = {
  role: CenterRole | null;
  centerId: string | null;
  isActive: boolean;
  status: "pending" | "verified" | "rejected" | null;
};

async function resolveRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  slug: string,
): Promise<CenterAccess> {
  const { data: centerBySlug } = await supabase
    .from("centers")
    .select("center_id, user_id, is_active, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!centerBySlug?.center_id) {
    return {
      role: null,
      centerId: null,
      isActive: false,
      status: null,
    };
  }

  if (centerBySlug.user_id === userId) {
    return {
      role: "owner",
      centerId: centerBySlug.center_id,
      isActive: Boolean(centerBySlug.is_active),
      status: centerBySlug.status,
    };
  }

  const { data: membership } = await supabase
    .from("center_members")
    .select("membership_id")
    .eq("center_id", centerBySlug.center_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return {
      role: null,
      centerId: centerBySlug.center_id,
      isActive: Boolean(centerBySlug.is_active),
      status: centerBySlug.status,
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const r = profile?.role as string | null;
  if (r === "admin" || r === "examiner") {
    return {
      role: r,
      centerId: centerBySlug.center_id,
      isActive: Boolean(centerBySlug.is_active),
      status: centerBySlug.status,
    };
  }

  return {
    role: null,
    centerId: centerBySlug.center_id,
    isActive: Boolean(centerBySlug.is_active),
    status: centerBySlug.status,
  };
}

async function getLatestAccessibleCenter(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<{ slug: string; role: CenterRole } | null> {
  const { data: ownedCenter } = await supabase
    .from("centers")
    .select("slug")
    .eq("user_id", userId)
    .eq("is_active", true)
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownedCenter?.slug) {
    return { slug: ownedCenter.slug, role: "owner" };
  }

  const { data: membership } = await supabase
    .from("center_members")
    .select("centers(slug, is_active, status)")
    .eq("user_id", userId)
    .order("invited_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const center = Array.isArray(membership?.centers)
    ? membership?.centers[0]
    : membership?.centers;

  if (!center?.slug || !center.is_active || center.status === "rejected") {
    return null;
  }

  const access = await resolveRole(supabase, userId, center.slug);
  if (access.role) {
    return { slug: center.slug, role: access.role };
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes perform their own session + permission checks.
  // Skipping middleware DB calls here removes a large latency chunk.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 1. Public routes — no auth required ───────────────────────────────────
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/reset-password");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ── 2. Authenticated user hitting login or register → redirect to dashboard ─
  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const latest = await getLatestAccessibleCenter(supabase, user.id);
    if (latest) {
      const url = request.nextUrl.clone();
      url.pathname = `/dashboard/${latest.slug}${ROLE_DEFAULT_SEGMENT[latest.role]}`;
      return NextResponse.redirect(url);
    }
  }

  // ── 3. Dashboard RBAC enforcement ─────────────────────────────────────────
  // Only run for /dashboard/[slug]/... page routes (skip API routes)
  if (
    user &&
    pathname.startsWith("/dashboard/") &&
    !pathname.startsWith("/api/")
  ) {
    const parts = pathname.split("/"); // ["", "dashboard", slug, ...rest]
    const slug = parts[2];

    if (slug) {
      const relative = "/" + parts.slice(3).join("/");
      const access = await resolveRole(supabase, user.id, slug);

      if (!access.centerId) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

      if (!access.isActive || access.status === "rejected") {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

      if (!access.role) {
        // No access to this center at all
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

      if (!isAllowedPath(relative, access.role)) {
        // Has a role but is trying a forbidden path — send to their default
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${slug}${ROLE_DEFAULT_SEGMENT[access.role]}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
