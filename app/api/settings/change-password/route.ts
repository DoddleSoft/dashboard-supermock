import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 },
      );
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Cookie setting may fail
            }
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 },
      );
    }

    // Verify current password by attempting sign-in via admin-generated token
    // We use signInWithPassword on the server SSR client itself (it won't
    // destroy the browser session because cookies aren't forwarded back for
    // the sign-in call — we simply check whether it succeeds).
    const verifySupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          // Isolated cookie jar — reads nothing, writes nothing
          getAll: () => [],
          setAll: () => {},
        },
      },
    );

    const { error: signInError } = await verifySupabase.auth.signInWithPassword(
      {
        email: user.email,
        password: currentPassword,
      },
    );

    if (signInError) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    // Update password using admin client (doesn't require a session)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
