import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type DashboardStats = {
  totalStudents: number;
  completedTests: number;
  totalPapers: number;
  totalMockTestRegistered: number;
};

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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("center_members")
      .select("membership_id")
      .eq("center_id", center.center_id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasMembership = Boolean(membership?.membership_id);
  }

  if (!isOwner && !hasMembership) {
    return NextResponse.json(
      { error: "Forbidden. You do not have access to this center." },
      { status: 403 },
    );
  }

  const [studentsResult, papersResult, completedResult, attemptsResult] =
    await Promise.all([
      supabase
        .from("student_profiles")
        .select("student_id", { count: "exact", head: true })
        .eq("center_id", center.center_id),
      supabase
        .from("papers")
        .select("id", { count: "exact", head: true })
        .eq("center_id", center.center_id),
      supabase
        .from("mock_attempts")
        .select("id, student_profiles!inner(center_id)", {
          count: "exact",
          head: true,
        })
        .eq("student_profiles.center_id", center.center_id)
        .eq("status", "completed"),
      supabase
        .from("mock_attempts")
        .select("id, student_profiles!inner(center_id)", {
          count: "exact",
          head: true,
        })
        .eq("student_profiles.center_id", center.center_id),
    ]);

  if (studentsResult.error) {
    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 },
    );
  }

  if (papersResult.error) {
    return NextResponse.json(
      { error: "Failed to load papers" },
      { status: 500 },
    );
  }

  if (completedResult.error) {
    return NextResponse.json(
      { error: "Failed to load completed tests" },
      { status: 500 },
    );
  }

  if (attemptsResult.error) {
    return NextResponse.json(
      { error: "Failed to load mock attempts" },
      { status: 500 },
    );
  }

  const stats: DashboardStats = {
    totalStudents: studentsResult.count ?? 0,
    completedTests: completedResult.count ?? 0,
    totalPapers: papersResult.count ?? 0,
    totalMockTestRegistered: attemptsResult.count ?? 0,
  };

  return NextResponse.json({ stats }, { status: 200 });
}
