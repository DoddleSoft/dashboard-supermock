import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_LIMITS = [25, 50, 75, 100] as const;
type AllowedLimit = (typeof ALLOWED_LIMITS)[number];

interface ReviewRpcModule {
  attemptModuleId: string;
  moduleType: string | null;
  heading: string | null;
  status: string | null;
  score: number | null;
  band: number | null;
  timeSpentSeconds: number | null;
  completedAt: string | null;
}

interface ReviewRpcItem {
  attemptId: string;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
  status: string | null;
  createdAt: string | null;
  modules: ReviewRpcModule[];
}

function parseLimit(raw: string | null): AllowedLimit {
  const n = parseInt(raw ?? "25", 10);
  return (ALLOWED_LIMITS as readonly number[]).includes(n)
    ? (n as AllowedLimit)
    : 25;
}

async function createAuthenticatedClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

// ── GET: Fetch reviews with server-side filtering & pagination ──────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const centerId = searchParams.get("centerId")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = parseLimit(searchParams.get("limit"));
  const search = searchParams.get("search")?.trim() ?? "";
  const moduleFilter = searchParams.get("module")?.trim() ?? "all";
  const status = searchParams.get("status")?.trim() ?? "all";

  if (!centerId) {
    return NextResponse.json({ error: "Missing centerId" }, { status: 400 });
  }

  const supabase = await createAuthenticatedClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to this center (owner or member)
  const { data: center } = await supabase
    .from("centers")
    .select("center_id, user_id")
    .eq("center_id", centerId)
    .maybeSingle();

  if (!center) {
    return NextResponse.json({ error: "Center not found" }, { status: 404 });
  }

  const isOwner = center.user_id === user.id;

  if (!isOwner) {
    const { data: membership } = await supabase
      .from("center_members")
      .select("membership_id")
      .eq("center_id", centerId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this center" },
        { status: 403 },
      );
    }
  }

  // NOTE: The RPC fetches all center data and we filter/paginate in JS.
  // For large-scale usage, pagination should be pushed into the RPC.
  const { data, error } = await supabase.rpc("get_center_reviews", {
    p_center_id: centerId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }

  let reviews = (data || []).map((item: ReviewRpcItem) => ({
    attemptId: item.attemptId,
    studentId: item.studentId,
    studentName: item.studentName ?? "Student",
    studentEmail: item.studentEmail ?? "",
    status: item.status ?? "unknown",
    createdAt: item.createdAt,
    modules: (item.modules || []).map((mod: ReviewRpcModule) => ({
      attemptModuleId: mod.attemptModuleId,
      moduleType: mod.moduleType ?? "unknown",
      heading: mod.heading,
      status: mod.status,
      score: mod.score,
      band: mod.band,
      timeSpentSeconds: mod.timeSpentSeconds,
      completedAt: mod.completedAt,
    })),
  }));

  // Server-side filtering
  if (search) {
    const q = search.toLowerCase();
    reviews = reviews.filter(
      (r: { studentName: string; studentEmail: string }) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentEmail.toLowerCase().includes(q),
    );
  }

  if (moduleFilter !== "all") {
    reviews = reviews.filter((r: { modules: { moduleType: string }[] }) =>
      r.modules.some((mod) => mod.moduleType === moduleFilter),
    );
  }

  if (status !== "all") {
    reviews = reviews.filter((r: { status: string }) => {
      const statusKey = r.status.toLowerCase().replace(/[\s_]+/g, "-");
      return statusKey === status;
    });
  }

  const total = reviews.length;
  const from = (page - 1) * limit;
  const paginated = reviews.slice(from, from + limit);

  return NextResponse.json({
    reviews: paginated,
    total,
    page,
    limit,
  });
}

// ── DELETE: Delete a mock attempt with server-side auth ──────────────────────
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { attemptId } = body;

  if (!attemptId || typeof attemptId !== "string") {
    return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
  }

  const supabase = await createAuthenticatedClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS policies on mock_attempts enforce authorization at the database level
  const { error } = await supabase
    .from("mock_attempts")
    .delete()
    .eq("id", attemptId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete attempt" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
