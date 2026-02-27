import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import supabaseAdmin from "@/lib/supabase/admin";

// ─── Sanitisation ─────────────────────────────────────────────────────────────

function sanitizeString(raw: unknown, maxLen = 255): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[<>"'`\\]/g, "").trim().slice(0, maxLen);
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Password: min 8 chars, at least one uppercase, one lowercase, one digit
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// ─── Rate limiter (in-memory, per authenticated user) ─────────────────────────
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const bucket = rateBucket.get(userId) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + RATE_WINDOW_MS; }
  bucket.count++;
  rateBucket.set(userId, bucket);
  return bucket.count <= RATE_LIMIT;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Cap payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 8192) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

    // 2. Validate & sanitise inputs
    const fullName  = sanitizeString(body.full_name, 200);
    const emailRaw  = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password  = typeof body.password === "string" ? body.password : "";
    const centerId  = sanitizeString(body.center_id, 100);
    const role      = ["admin", "examiner"].includes(body.role as string)
      ? (body.role as "admin" | "examiner")
      : null;

    const errors: string[] = [];
    if (!fullName)                       errors.push("Full name is required.");
    if (!EMAIL_RE.test(emailRaw))        errors.push("Invalid email format.");
    if (!PASSWORD_RE.test(password))     errors.push("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
    if (!centerId)                       errors.push("Center ID is required.");
    if (!role)                           errors.push("Role must be 'admin' or 'examiner'.");

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
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    // 4. Rate limit
    if (!checkRateLimit(caller.id)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
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
        { error: "Forbidden. Only the center owner can add members." },
        { status: 403 },
      );
    }

    // ── 6. Resolve the auth user ID ────────────────────────────────────────
    // We need a valid auth.users entry. Three cases:
    //   a) Email already in public.users → reuse existing user_id
    //   b) Email not found anywhere → create fresh auth user
    //   c) Email in auth.users but not in public.users (orphan) → look up via RPC

    let userId: string;
    let createdNewAuthUser = false;

    // (a) Check public.users by email first
    const { data: existingPublicUser } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("email", emailRaw)
      .maybeSingle();

    if (existingPublicUser?.user_id) {
      userId = existingPublicUser.user_id;
    } else {
      // (b) Attempt to create a fresh auth user (email pre-verified)
      const { data: newAuthUser, error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email: emailRaw,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
        });

      if (createAuthError) {
        const msg = createAuthError.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          // (c) Orphaned auth user — look them up via the secure RPC
          const { data: authRows, error: rpcError } = await supabaseAdmin.rpc(
            "admin_get_auth_user_by_email",
            { p_email: emailRaw },
          );
          if (rpcError || !authRows || authRows.length === 0) {
            console.error("[create-member] RPC lookup failed:", rpcError?.message);
            return NextResponse.json(
              { error: "An account with this email already exists and could not be linked." },
              { status: 409 },
            );
          }
          userId = authRows[0].id as string;
        } else {
          console.error("[create-member] auth.admin.createUser:", createAuthError.message);
          return NextResponse.json(
            { error: "Failed to create auth account. Please try again." },
            { status: 500 },
          );
        }
      } else {
        userId = newAuthUser.user.id;
        createdNewAuthUser = true;
      }

      // ── 6b. Ensure public.users row exists ─────────────────────────────
      // The on_auth_user_created trigger may have already inserted the row.
      // We upsert to guarantee it — if trigger worked, ON CONFLICT is a no-op;
      // if the trigger failed silently, this creates the row for the first time.
      // Without this row, the center_members FK will fail.
      const { error: upsertError } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            user_id:   userId,
            email:     emailRaw,
            full_name: fullName,
            role,
            is_active: true,
          },
          { onConflict: "user_id" },
        );

      if (upsertError) {
        // Roll back the auth user if we just created it
        if (createdNewAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
        console.error("[create-member] upsert users:", upsertError.message);
        return NextResponse.json(
          { error: "Failed to create user profile." + (createdNewAuthUser ? " Auth account rolled back." : "") },
          { status: 500 },
        );
      }
    }

    // ── 7. Guard: already a member of this center? ─────────────────────────
    const { data: existingMember } = await supabaseAdmin
      .from("center_members")
      .select("membership_id")
      .eq("center_id", centerId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of this center." },
        { status: 409 },
      );
    }

    // ── 8. Insert into center_members ──────────────────────────────────────
    const { data: membership, error: memberInsertError } = await supabaseAdmin
      .from("center_members")
      .insert({ center_id: centerId, user_id: userId })
      .select()
      .single();

    if (memberInsertError) {
      if (createdNewAuthUser) {
        await supabaseAdmin.from("users").delete().eq("user_id", userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      console.error("[create-member] insert center_members:", memberInsertError.message);
      return NextResponse.json(
        { error: "Failed to link member to center." + (createdNewAuthUser ? " All changes rolled back." : "") },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, membership }, { status: 201 });
  } catch (err) {
    console.error("[create-member] unhandled:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export function GET()    { return NextResponse.json({ error: "Method not allowed." }, { status: 405 }); }
export function PUT()    { return NextResponse.json({ error: "Method not allowed." }, { status: 405 }); }
export function DELETE() { return NextResponse.json({ error: "Method not allowed." }, { status: 405 }); }
export function PATCH()  { return NextResponse.json({ error: "Method not allowed." }, { status: 405 }); }
