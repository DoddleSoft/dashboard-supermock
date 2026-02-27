import { createClient } from "@/lib/supabase/client";

export type CenterUsage = {
  tier_name: string;
  student_count: number;
  module_count: number;
  mock_attempt_count: number;
  used_gb: number;
  limit_gb: number;
  used_pct: number;
  last_calculated_at: string | null;
};

// Storage weights (in KB)
const KB_PER_STUDENT = 25;
const KB_PER_MOCK_ATTEMPT = 1_500;
const KB_PER_MODULE = 30 * 1_024; // 30 MB

const KB_TO_GB = 1_024 * 1_024;

const DEFAULT_LIMIT_GB = 10;

export async function getCenterUsage(
  centerId: string,
): Promise<CenterUsage | null> {
  const supabase = createClient();

  // ── 1. Fetch usage counts + tier_id + tier enum ──────────────────────────
  const { data: usageRow, error: usageError } = await supabase
    .from("center_usage")
    .select(
      "student_count, module_count, mock_attempt_count, last_calculated_at, tier_id, tier",
    )
    .eq("center_id", centerId)
    .maybeSingle();

  if (usageError) {
    console.error(
      "[getCenterUsage] center_usage fetch error:",
      usageError.message,
    );
    return null;
  }

  if (!usageRow) {
    console.warn("[getCenterUsage] no usage row found for center:", centerId);
    return null;
  }

  const studentCount = usageRow.student_count ?? 0;
  const moduleCount = usageRow.module_count ?? 0;
  const mockAttemptCount = usageRow.mock_attempt_count ?? 0;

  // ── 2. Fetch tier limit (best-effort, by tier_id if available, else by name) ──
  let limit_gb = DEFAULT_LIMIT_GB;
  let tier_name = (usageRow.tier as string | null) ?? "Free";

  if (usageRow.tier_id) {
    const { data: tierRow, error: tierError } = await supabase
      .from("tiers")
      .select("name, storage_limit_gb")
      .eq("id", usageRow.tier_id)
      .maybeSingle();

    if (!tierError && tierRow) {
      tier_name = tierRow.name;
      limit_gb = tierRow.storage_limit_gb ?? DEFAULT_LIMIT_GB;
    } else if (tierError) {
      console.warn("[getCenterUsage] tier fetch error:", tierError.message);
    }
  } else if (usageRow.tier) {
    // Fallback: match by name (tier enum value stored as text)
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

  // ── 3. Compute storage ────────────────────────────────────────────────────
  const used_kb =
    studentCount * KB_PER_STUDENT +
    mockAttemptCount * KB_PER_MOCK_ATTEMPT +
    moduleCount * KB_PER_MODULE;

  const used_gb = used_kb / KB_TO_GB;
  const used_pct = limit_gb > 0 ? Math.min((used_gb / limit_gb) * 100, 100) : 0;

  return {
    tier_name,
    student_count: studentCount,
    module_count: moduleCount,
    mock_attempt_count: mockAttemptCount,
    used_gb: Math.round(used_gb * 100) / 100, // 2 dp
    limit_gb,
    used_pct: Math.round(used_pct * 10) / 10, // 1 dp
    last_calculated_at: usageRow.last_calculated_at ?? null,
  };
}
