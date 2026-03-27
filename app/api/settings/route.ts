import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function createSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
}

async function verifyAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  slug: string,
) {
  const { data: center } = await supabase
    .from("centers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!center) return { center: null, allowed: false };

  const isOwner = center.user_id === userId;
  if (isOwner) return { center, allowed: true };

  const [memberResult, profileResult] = await Promise.all([
    supabase
      .from("center_members")
      .select("membership_id")
      .eq("center_id", center.center_id)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("users").select("role").eq("user_id", userId).maybeSingle(),
  ]);

  const isMember = !!memberResult.data;
  const role = profileResult.data?.role;

  if (isMember && role === "admin") return { center, allowed: true };

  return { center: null, allowed: false };
}

const ALLOWED_FIELDS = [
  "name",
  "logo_url",
  "about",
  "website_url",
  "facebook_url",
  "instagram_url",
  "linkedin_url",
  "whatsapp",
  "phone",
  "address",
  "latitude",
  "longitude",
  "operating_hours",
  "supported_test_formats",
];

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabase(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { center, allowed } = await verifyAccess(supabase, user.id, slug);
  if (!allowed || !center) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ settings: center });
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createSupabase(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, ...updates } = body;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { center, allowed } = await verifyAccess(supabase, user.id, slug);
  if (!allowed || !center) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Filter to only allowed fields
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in updates) {
      sanitized[key] = updates[key];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  sanitized.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("centers")
    .update(sanitized)
    .eq("center_id", center.center_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
