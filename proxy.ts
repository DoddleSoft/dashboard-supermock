import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/callback",
    "/auth/onboarding",
    "/",
  ];
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    // First, check if user owns a center
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

    // If not an owner, check if they're a member of any center
    const { data: membership } = await supabase
      .from("center_members")
      .select(
        `
        center_id,
        centers (
          slug,
          is_active
        )
      `,
      )
      .eq("user_id", user.id)
      .order("invited_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membership?.centers) {
      const center = Array.isArray(membership.centers)
        ? membership.centers[0]
        : membership.centers;

      if (center?.is_active && center?.slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/dashboard/${center.slug}`;
        return NextResponse.redirect(url);
      }
    }

    // If no center found, allow them to stay on login/register page
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
