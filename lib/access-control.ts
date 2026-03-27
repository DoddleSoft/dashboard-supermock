export type CenterRole = "owner" | "admin" | "examiner";

export const ROLE_ALLOWED_SEGMENTS: Record<CenterRole, string[]> = {
  owner: [
    "",
    "/tests",
    "/questions",
    "/papers",
    "/reviews",
    "/students",
    "/members",
    "/support",
    "/create",
    "/settings",
  ],
  admin: [
    "",
    "/tests",
    "/questions",
    "/papers",
    "/reviews",
    "/students",
    "/support",
    "/create",
    "/settings",
  ],
  examiner: ["/reviews", "/questions", "/create/modules", "/support"],
};

export const ROLE_DEFAULT_SEGMENT: Record<CenterRole, string> = {
  owner: "",
  admin: "",
  examiner: "/reviews",
};

export function normalizeRelativePath(relativePath: string): string {
  if (!relativePath || relativePath === "/") return "";
  return relativePath.endsWith("/") ? relativePath.slice(0, -1) : relativePath;
}

export function isAllowedPath(relativePath: string, role: CenterRole): boolean {
  const normalized = normalizeRelativePath(relativePath);
  return ROLE_ALLOWED_SEGMENTS[role].some((segment) => {
    if (segment === "") return normalized === "";
    return normalized === segment || normalized.startsWith(`${segment}/`);
  });
}
