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

export async function getCenterUsage(
  slug: string,
): Promise<CenterUsage | null> {
  if (!slug) return null;

  try {
    const response = await fetch(
      `/api/center-usage?slug=${encodeURIComponent(slug)}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { usage?: CenterUsage | null };
    return payload.usage ?? null;
  } catch {
    return null;
  }
}
