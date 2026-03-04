import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CenterUsage = {
  tier_name: string;
  student_count: number;
  module_count: number;
  mock_attempt_count: number;
  used_gb: number;
  limit_gb: number;
  used_pct: number;
  last_calculated_at: string | null;
};

const KB_PER_STUDENT = 25;
const KB_PER_MOCK_ATTEMPT = 1_500;
const KB_PER_MODULE = 30 * 1_024;
const KB_TO_GB = 1_024 * 1_024;
const DEFAULT_LIMIT_GB = 10;

export async function GET(request: NextRequest) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json(
      { error: "Missing required query param: slug" },
      { status: 400 },
    );
  }

  const { data: center } = await supabase
    .from("centers")
    .select("center_id, user_id, is_active, status")
    .eq("slug", slug)
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

  let hasMembership = false;
  let role: "admin" | "examiner" | "owner" | null = isOwner ? "owner" : null;

  if (!isOwner) {
    const [membershipResult, profileResult] = await Promise.all([
      supabase
        .from("center_members")
        .select("membership_id")
        .eq("center_id", center.center_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    hasMembership = Boolean(membershipResult.data?.membership_id);

    const profile = profileResult.data;

    if (profile?.role === "admin" || profile?.role === "examiner") {
      role = profile.role;
    }
  }

  const canReadUsage = isOwner || (hasMembership && role === "admin");
  if (!canReadUsage) {
    return NextResponse.json(
      { error: "Forbidden: no read access to center usage" },
      { status: 403 },
    );
  }

  const { data: usageRow, error: usageError } = await supabase
    .from("center_usage")
    .select(
      "student_count, module_count, mock_attempt_count, last_calculated_at, tier_id, tier",
    )
    .eq("center_id", center.center_id)
    .maybeSingle();

  if (usageError) {
    return NextResponse.json(
      { error: "Failed to load center usage" },
      { status: 500 },
    );
  }

  if (!usageRow) {
    return NextResponse.json({ usage: null }, { status: 200 });
  }

  const studentCount = usageRow.student_count ?? 0;
  const moduleCount = usageRow.module_count ?? 0;
  const mockAttemptCount = usageRow.mock_attempt_count ?? 0;

  let limit_gb = DEFAULT_LIMIT_GB;
  let tier_name = (usageRow.tier as string | null) ?? "Free";

  if (usageRow.tier_id) {
    const { data: tierRow } = await supabase
      .from("tiers")
      .select("name, storage_limit_gb")
      .eq("id", usageRow.tier_id)
      .maybeSingle();

    if (tierRow) {
      tier_name = tierRow.name;
      limit_gb = tierRow.storage_limit_gb ?? DEFAULT_LIMIT_GB;
    }
  } else if (usageRow.tier) {
    const { data: tierRow } = await supabase
      .from("tiers")
      .select("name, storage_limit_gb")
      .ilike("name", usageRow.tier)
      .maybeSingle();

    if (tierRow) {
      tier_name = tierRow.name;
      limit_gb = tierRow.storage_limit_gb ?? DEFAULT_LIMIT_GB;
    }
  }

  const used_kb =
    studentCount * KB_PER_STUDENT +
    mockAttemptCount * KB_PER_MOCK_ATTEMPT +
    moduleCount * KB_PER_MODULE;

  const used_gb = used_kb / KB_TO_GB;
  const used_pct = limit_gb > 0 ? Math.min((used_gb / limit_gb) * 100, 100) : 0;

  const usage: CenterUsage = {
    tier_name,
    student_count: studentCount,
    module_count: moduleCount,
    mock_attempt_count: mockAttemptCount,
    used_gb: Math.round(used_gb * 100) / 100,
    limit_gb,
    used_pct: Math.round(used_pct * 10) / 10,
    last_calculated_at: usageRow.last_calculated_at ?? null,
  };

  return NextResponse.json({ usage }, { status: 200 });
}
