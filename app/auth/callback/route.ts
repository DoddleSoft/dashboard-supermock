import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
            // Handle cookie setting errors if necessary {not catching cookies so no worry}
          }
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.session.user;
      if (!user.email_confirmed_at) {
        return NextResponse.redirect(
          new URL("/auth/login?error=unverified_email", request.url),
        );
      }

      // Check if user profile exists in users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id, role")
        .eq("user_id", data.session.user.id)
        .single();

      if (existingUser) {
        // User has a profile, check if they have any centers
        const { data: centers } = await supabase
          .from("centers")
          .select("slug")
          .eq("user_id", data.session.user.id)
          .limit(1);

        const origin = new URL(request.url).origin;

        if (centers && centers.length > 0) {
          // User has centers, redirect to first center's dashboard
          const center = centers[0];
          return NextResponse.redirect(
            `${origin}/dashboard/${centers[0].slug}`,
          );
        } else {
          // User profile exists but no centers - redirect to onboarding to create one
          return NextResponse.redirect(`${origin}/auth/onboarding`);
        }
      } else {
        // No user profile - redirect to onboarding
        // User will create profile and first center in onboarding
        return NextResponse.redirect(new URL("/auth/onboarding", request.url));
      }
    }
  }

  // Redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=verification_failed", request.url),
  );
}
