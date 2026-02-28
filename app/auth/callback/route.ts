import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Handle cookie setting errors if necessary
          }
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;
      const origin = new URL(request.url).origin;

      if (!user.email_confirmed_at) {
        return NextResponse.redirect(
          new URL("/auth/login?error=unverified_email", request.url),
        );
      }

      // Read user profile (created by handle_new_user trigger)
      const { data: profile } = await supabase
        .from("users")
        .select("user_id, role")
        .eq("user_id", user.id)
        .single();

      const role = profile?.role as string | undefined;

      // ── Owner ─────────────────────────────────────────────────
      if (!profile || role === "owner") {
        const { data: centers } = await supabase
          .from("centers")
          .select("slug")
          .eq("user_id", user.id)
          .limit(1);

        if (centers && centers.length > 0) {
          return NextResponse.redirect(
            `${origin}/dashboard/${centers[0].slug}`,
          );
        }
        return NextResponse.redirect(`${origin}/auth/onboarding`);
      }

      // ── Admin / Examiner ───────────────────────────────────────
      if (role === "admin" || role === "examiner") {
        // Check center membership (admins/examiners are auto-registered to centers)
        const { data: membership } = await supabase
          .from("center_members")
          .select("center_id, centers(slug)")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (membership && (membership.centers as any)) {
          const slug = (membership.centers as unknown as { slug: string }).slug;
          return NextResponse.redirect(`${origin}/dashboard/${slug}`);
        }

        // No center affiliation found - this shouldn't happen for admins/examiners
        return NextResponse.redirect(
          new URL("/auth/login?error=no_center_access", request.url),
        );
      }

      // Fallback
      return NextResponse.redirect(`${origin}/auth/onboarding`);
    }
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=verification_failed", request.url),
  );
}
