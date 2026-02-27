import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// ─── Role-based access control ────────────────────────────────────────────────

type CenterRole = "owner" | "admin" | "examiner";

/** Path segments (relative to /dashboard/[slug]) each role may access. */
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

/** Default segment each role should land on inside the dashboard. */
const ROLE_DEFAULT_SEGMENT: Record<CenterRole, string> = {
  owner: "",
  admin: "",
  examiner: "/reviews",
};

function isAllowed(relative: string, role: CenterRole): boolean {
  return ROLE_ALLOWED_SEGMENTS[role].some((seg) => {
    if (seg === "") return relative === "";
    return relative === seg || relative.startsWith(seg + "/");
  });
}

/**
 * Resolves the current user's role for the given center slug.
 * Returns null if the user has no access at all.
 */
async function resolveRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  slug: string,
): Promise<CenterRole | null> {
  // 1. Check ownership
  const { data: owned } = await supabase
    .from("centers")
    .select("center_id")
    .eq("slug", slug)
    .eq("user_id", userId)
    .maybeSingle();

  if (owned?.center_id) return "owner";

  // 2. Check membership — look up the center by slug, then verify membership
  const { data: centerBySlug } = await supabase
    .from("centers")
    .select("center_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!centerBySlug?.center_id) return null;

  const { data: membership } = await supabase
    .from("center_members")
    .select("membership_id")
    .eq("center_id", centerBySlug.center_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  // 3. Get the user's role from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  const r = profile?.role as string | null;
  if (r === "admin" || r === "examiner") return r;
  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
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
  const { pathname } = request.nextUrl;

  // ── 1. Public routes — no auth required ───────────────────────────────────
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/callback",
    "/auth/reset-password",
    "/",
  ];
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ── 2. Authenticated user hitting login or register → redirect to dashboard ─
  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    // Check owner first
    const { data: ownedCenter } = await supabase
      .from("centers")
      .select("slug")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ownedCenter?.slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/dashboard/${ownedCenter.slug}`;
      return NextResponse.redirect(url);
    }

    // Check membership
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

      if (center?.is_active && center?.slug) {
        // Find their role to redirect to the correct default page
        const role = await resolveRole(supabase, user.id, center.slug);
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${center.slug}${role ? ROLE_DEFAULT_SEGMENT[role] : ""}`;
        return NextResponse.redirect(url);
      }
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
      const relativeNormalized =
        relative === "/" ? "" : relative.replace(/\/$/, "");

      const role = await resolveRole(supabase, user.id, slug);

      if (!role) {
        // No access to this center at all
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

      if (!isAllowed(relativeNormalized, role)) {
        // Has a role but is trying a forbidden path — send to their default
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${slug}${ROLE_DEFAULT_SEGMENT[role]}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
