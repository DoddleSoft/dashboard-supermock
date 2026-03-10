import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import supabaseAdmin from "@/lib/supabase/admin";

// ─── Sanitisation ─────────────────────────────────────────────────────────────

function sanitizeString(raw: unknown, maxLen = 255): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[<>"'`\\]/g, "")
    .trim()
    .slice(0, maxLen);
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// ─── Rate limiter (in-memory, per authenticated user) ─────────────────────────
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBucket.get(userId) ?? {
    count: 0,
    resetAt: now + RATE_WINDOW_MS,
  };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }
  bucket.count++;
  rateBucket.set(userId, bucket);
  return bucket.count <= RATE_LIMIT;
}

// ─── PATCH: Update a center member ───────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    // 1. Cap payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 8192) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    // 2. Validate inputs
    const targetUserId = sanitizeString(body.user_id, 100);
    const centerId = sanitizeString(body.center_id, 100);
    const fullName = sanitizeString(body.full_name, 200);
    const emailRaw =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = ["admin", "examiner"].includes(body.role as string)
      ? (body.role as "admin" | "examiner")
      : null;
    const isActive =
      typeof body.is_active === "boolean" ? body.is_active : null;

    const errors: string[] = [];
    if (!targetUserId) errors.push("User ID is required.");
    if (!centerId) errors.push("Center ID is required.");
    if (!fullName) errors.push("Full name is required.");
    if (!EMAIL_RE.test(emailRaw)) errors.push("Invalid email format.");
    if (!role) errors.push("Role must be 'admin' or 'examiner'.");
    if (isActive === null) errors.push("Status (is_active) is required.");

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
    }

    // 3. Authenticate caller via session cookie
    const cookieStore = await cookies();
    const callerClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    );
    const {
      data: { user: caller },
      error: authError,
    } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // 4. Rate limit
    if (!checkRateLimit(caller.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    // 5. Authorise: caller must be the center owner
    const { data: center } = await supabaseAdmin
      .from("centers")
      .select("center_id")
      .eq("center_id", centerId)
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!center) {
      return NextResponse.json(
        { error: "Forbidden. Only the center owner can edit members." },
        { status: 403 },
      );
    }

    // 6. Verify the target user is a member of this center (not the owner)
    const { data: membership } = await supabaseAdmin
      .from("center_members")
      .select("membership_id")
      .eq("center_id", centerId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "This user is not a member of this center." },
        { status: 404 },
      );
    }

    // Prevent editing the owner themselves
    if (targetUserId === caller.id) {
      return NextResponse.json(
        { error: "You cannot edit your own membership via this endpoint." },
        { status: 403 },
      );
    }

    // 7. Check if email is being changed and if the new email is already taken
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("user_id", targetUserId)
      .single();

    if (currentUser && currentUser.email !== emailRaw) {
      // Check if another user already has this email
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("email", emailRaw)
        .neq("user_id", targetUserId)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { error: "Another user with this email already exists." },
          { status: 409 },
        );
      }
    }

    // 8. Update auth.users via admin API (email + user_metadata)
    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        email: emailRaw,
        user_metadata: { full_name: fullName, role },
      });

    if (authUpdateError) {
      return NextResponse.json(
        { error: "Failed to update auth account: " + authUpdateError.message },
        { status: 500 },
      );
    }

    // 9. Update public.users table
    const { error: dbUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        full_name: fullName,
        email: emailRaw,
        role,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (dbUpdateError) {
      return NextResponse.json(
        { error: "Failed to update user profile: " + dbUpdateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function POST() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
