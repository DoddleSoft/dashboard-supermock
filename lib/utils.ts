export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Helper function to format timestamp to local time
export const formatLocalTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    // Format as: "Jan 16, 2025, 2:30 PM"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    return "N/A";
  }
};

// Helper function to get relative time (e.g., "2 hours ago")
export const getRelativeTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return "just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
    return formatLocalTime(isoString);
  } catch (error) {
    return "N/A";
  }
};

/**
 * Converts any thrown error (Supabase, network, unknown) into a
 * human-readable message. Pass a context-specific fallback so the
 * user always knows what operation failed.
 */
export function parseError(error: unknown, fallback: string): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as Record<string, unknown>).message)
        : String(error ?? "");

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as Record<string, unknown>).code)
      : "";

  const lower = msg.toLowerCase();

  // Network / connectivity
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("err_network")
  ) {
    return "Connection failed. Please check your internet and try again.";
  }

  // Session / auth
  if (lower.includes("jwt expired") || lower.includes("session expired")) {
    return "Your session has expired. Please log in again.";
  }
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please verify your email address before logging in.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("email address is already")
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  // Postgres constraint errors (Supabase surfaces these)
  if (
    code === "23505" ||
    lower.includes("duplicate key") ||
    lower.includes("unique constraint")
  ) {
    return "A record with these details already exists. Please use different information.";
  }
  if (
    code === "23503" ||
    lower.includes("foreign key") ||
    lower.includes("violates foreign key")
  ) {
    return "This record is linked to other data and cannot be modified.";
  }
  if (
    code === "42501" ||
    lower.includes("permission denied") ||
    lower.includes("row-level security")
  ) {
    return "You don't have permission to perform this action.";
  }
  if (
    code === "23502" ||
    lower.includes("not-null constraint") ||
    lower.includes("null value in column")
  ) {
    return "Some required information is missing. Please fill in all required fields.";
  }

  // Storage errors
  if (lower.includes("storage") && lower.includes("quota")) {
    return "Storage limit reached. Please free up space or upgrade your plan.";
  }
  if (lower.includes("payload too large") || lower.includes("413")) {
    return "The file is too large to upload. Please use a smaller file.";
  }

  return fallback;
}

/**
 * Simple date format without time (e.g., "Jan 16, 2025")
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Capitalize first letter of a module type string (e.g., "reading" → "Reading")
 */
export const formatModuleType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * Get CSS classes for module type badges
 */
export const getModuleColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case "reading":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "listening":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "writing":
      return "bg-green-100 text-green-600 border-green-200";
    case "speaking":
      return "bg-orange-100 text-orange-600 border-orange-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

/**
 * Parse render blocks from content template (JSON or array)
 */
export const getRenderBlocks = (content: any): any[] => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ type: "text", content }];
    }
  }
  return content.blocks || [];
};
