import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_LIMITS = [25, 50, 75, 100] as const;
type AllowedLimit = (typeof ALLOWED_LIMITS)[number];

function parseLimit(raw: string | null): AllowedLimit {
  const n = parseInt(raw ?? "25", 10);
  return (ALLOWED_LIMITS as readonly number[]).includes(n)
    ? (n as AllowedLimit)
    : 25;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const centerId = searchParams.get("centerId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = parseLimit(searchParams.get("limit"));
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "all";

  if (!centerId) {
    return NextResponse.json({ error: "Missing centerId" }, { status: 400 });
  }

  // ── Auth: derive identity from the session cookie, never from the client ──
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Authorization: confirm user has access to this center ────────────────
  const { data: center } = await supabase
    .from("centers")
    .select("center_id, user_id, is_active, status")
    .eq("center_id", centerId)
    .maybeSingle();

  if (!center?.center_id) {
    return NextResponse.json({ error: "Center not found" }, { status: 404 });
  }

  if (!center.is_active || center.status === "rejected") {
    return NextResponse.json(
      { error: "Center is not accessible" },
      { status: 403 },
    );
  }

  const isOwner = center.user_id === user.id;

  if (!isOwner) {
    const { data: membership } = await supabase
      .from("center_members")
      .select("membership_id")
      .eq("center_id", centerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.membership_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── Query: server-side filtering + exact count + range pagination ─────────
  let query = supabase
    .from("student_profiles")
    .select("*", { count: "exact" })
    .eq("center_id", centerId)
    .order("enrolled_at", { ascending: false });

  if (search) {
    // Use ILIKE for partial/prefix matching (trigram GIN indexes make this fast).
    // FTS was replaced because websearch_to_tsquery requires complete words,
    // which breaks search-as-you-type UX.
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error: fetchError, count } = await query;

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }

  const students = (data ?? []).map((s: Record<string, unknown>) => ({
    student_id: s.student_id,
    center_id: s.center_id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    guardian: s.guardian,
    guardian_phone: s.guardian_phone,
    date_of_birth: s.date_of_birth,
    address: s.address,
    grade: s.grade,
    status: s.status ?? "active",
    enrollment_type: s.enrollment_type ?? "regular",
    testsCompleted: 0,
    enrolled_at: s.enrolled_at,
    updated_at: s.updated_at,
  }));

  return NextResponse.json({
    students,
    total: count ?? 0,
    page,
    limit,
  });
}
