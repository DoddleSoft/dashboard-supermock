import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // First, ensure user profile exists in public.users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .single();

      // Create user profile if it doesn't exist
      if (!existingUser) {
        const fullName =
          data.session.user.user_metadata?.full_name ||
          data.session.user.email?.split("@")[0] ||
          "User";

        await supabase.from("users").insert({
          user_id: data.session.user.id,
          email: data.session.user.email!,
          full_name: fullName,
          role: "admin",
          is_active: true,
        });
      }

      // Check if user has a center
      const { data: userData } = await supabase
        .from("users")
        .select("center_id, full_name")
        .eq("user_id", data.session.user.id)
        .single();

      if (userData?.center_id) {
        // User has a center, get slug and redirect to dashboard
        const { data: center } = await supabase
          .from("centers")
          .select("slug")
          .eq("center_id", userData.center_id)
          .single();

        if (center) {
          return NextResponse.redirect(
            new URL(`/dashboard/${center.slug}`, request.url)
          );
        }
      }

      // No center, redirect to onboarding
      return NextResponse.redirect(new URL("/auth/onboarding", request.url));
    }

    console.error("Error exchanging code:", error);
  }

  // Redirect to login with error
  return NextResponse.redirect(
    new URL("/auth/login?error=verification_failed", request.url)
  );
}
