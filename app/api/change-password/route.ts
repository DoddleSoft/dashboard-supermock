import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

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
            // Cookie setting may fail in some contexts
          }
        },
      },
    });

    // Verify the user has an active session (set by the recovery callback)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your session has expired. Please request a new password reset link.",
        },
        { status: 401 },
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      let errorMessage = updateError.message;

      if (
        updateError.message.includes(
          "should be different from the old password",
        )
      ) {
        errorMessage =
          "Please choose a different password from your current one.";
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Sign out after password change so user logs in fresh
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
