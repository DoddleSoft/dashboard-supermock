import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import supabaseAdmin from "@/lib/supabase/admin";

// ─── Sanitisation helpers ─────────────────────────────────────────────────────

/** Strip every character that could open an HTML/script injection vector. */
function sanitizeString(raw: unknown, maxLen = 255): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[<>"'`]/g, "") // strip XSS chars
    .replace(/\\/g, "") // strip backslashes
    .trim()
    .slice(0, maxLen);
}

/** Safe email: lowercase, ASCII only, proper format. */
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Password must be exactly 8 digits (numeric PIN). */
const PASSWORD_RE = /^\d{8}$/;

// ─── Rate-limit (in-memory, resets on cold start) ────────────────────────────
// Keyed by authenticated user_id so each staff account gets its own bucket.
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // max requests
const RATE_WINDOW_MS = 60_000; // per 60 s

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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Read body (cap at 8 KB to prevent over-sized payloads) ─────────
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

    // ── 2. Validate & sanitise inputs ──────────────────────────────────────
    const name = sanitizeString(body.name, 200);
    const emailRaw =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body.password === "string" ? body.password.trim() : "";
    const centerId = sanitizeString(body.center_id, 100);

    // Optional profile fields
    const phone = sanitizeString(body.phone, 30);
    const guardian = sanitizeString(body.guardian, 200);
    const guardianPhone = sanitizeString(body.guardian_phone, 30);
    const dob = sanitizeString(body.date_of_birth, 10);
    const address = sanitizeString(body.address, 500);
    const enrollmentType = ["regular", "mock_only", "visitor"].includes(
      body.enrollment_type as string,
    )
      ? (body.enrollment_type as string)
      : "regular";

    const errors: string[] = [];
    if (!name) errors.push("Full name is required.");
    if (!EMAIL_RE.test(emailRaw)) errors.push("Invalid email format.");
    if (!PASSWORD_RE.test(password))
      errors.push("Password must be exactly 8 digits (numbers only).");
    if (!centerId) errors.push("Center ID is required.");

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 422 });
    }

    // ── 3. Authenticate the caller via session cookie ──────────────────────
    const cookieStore = await cookies();
    const callerClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {}, // read-only in API routes
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

    // ── 4. Rate-limit by authenticated user ────────────────────────────────
    if (!checkRateLimit(caller.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 },
      );
    }

    // ── 5. Authorise: caller must belong to the target center ──────────────
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("center_members")
      .select("center_id")
      .eq("user_id", caller.id)
      .eq("center_id", centerId)
      .maybeSingle();

    // Also allow the center owner
    const { data: centerOwner } = await supabaseAdmin
      .from("centers")
      .select("center_id")
      .eq("center_id", centerId)
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!membership && !centerOwner) {
      return NextResponse.json(
        { error: "Forbidden. You do not have access to this center." },
        { status: 403 },
      );
    }

    // ── 6. Create auth user (email pre-verified) via admin client ──────────
    const { data: newAuthUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailRaw,
        password,
        email_confirm: true, // marks email as verified immediately
        user_metadata: { full_name: name, role: "student" },
      });

    if (createAuthError) {
      // Surface safe, user-friendly errors
      if (createAuthError.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
      console.error(
        "[create-student] auth.admin.createUser:",
        createAuthError.message,
      );
      return NextResponse.json(
        { error: "Failed to create user account. Please try again." },
        { status: 500 },
      );
    }

    const newUserId = newAuthUser.user.id;

    // ── 7. Insert student profile ──────────────────────────────────────────
    const { data: studentProfile, error: profileError } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        student_id: newUserId,
        center_id: centerId,
        name,
        email: emailRaw,
        phone: phone || null,
        guardian: guardian || null,
        guardian_phone: guardianPhone || null,
        date_of_birth: dob || null,
        address: address || null,
        enrollment_type: enrollmentType,
        status: "active",
        tests_taken: 0,
      })
      .select()
      .single();

    if (profileError) {
      // Roll back: remove the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      if (profileError.code === "23505") {
        return NextResponse.json(
          { error: "This student is already enrolled in this center." },
          { status: 409 },
        );
      }
      console.error(
        "[create-student] insert student_profiles:",
        profileError.message,
      );
      return NextResponse.json(
        { error: "Failed to enrol student. The auth account was rolled back." },
        { status: 500 },
      );
    }

    // ── 8. Success ─────────────────────────────────────────────────────────
    return NextResponse.json(
      { success: true, student: studentProfile },
      { status: 201 },
    );
  } catch (err) {
    console.error("[create-student] unhandled:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

// Reject all other HTTP methods
export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function PUT() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
export function PATCH() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
