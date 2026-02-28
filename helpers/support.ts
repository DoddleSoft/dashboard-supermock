import { createClient } from "@/lib/supabase/client";
import { parseError } from "@/lib/utils";

export interface SupportRequest {
  id: string;
  user_id: string;
  user_name: string;
  center_id: string;
  center_name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

export interface CreateSupportRequestData {
  user_id: string;
  user_name: string;
  center_id: string;
  center_name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Create a new support request
 */
export async function createSupportRequest(
  data: CreateSupportRequestData,
): Promise<{ success: boolean; error?: string; data?: SupportRequest }> {
  const supabase = createClient();

  try {
    const { data: supportRequest, error } = await supabase
      .from("support_requests")
      .insert([
        {
          user_id: data.user_id,
          user_name: data.user_name,
          center_id: data.center_id,
          center_name: data.center_name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating support request:", error);
      return {
        success: false,
        error: parseError(
          error,
          "Unable to submit your support request. Please try again.",
        ),
      };
    }

    return { success: true, data: supportRequest };
  } catch (error) {
    console.error("Unexpected error creating support request:", error);
    return {
      success: false,
      error: parseError(
        error,
        "Unable to submit your support request. Please try again.",
      ),
    };
  }
}

/**
 * Get support requests for the current user
 */
export async function getUserSupportRequests(
  userId: string,
): Promise<{ success: boolean; error?: string; data?: SupportRequest[] }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("support_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching support requests:", error);
      return {
        success: false,
        error: parseError(
          error,
          "Unable to load your support tickets. Please refresh the page.",
        ),
      };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching support requests:", error);
    return {
      success: false,
      error: parseError(
        error,
        "Unable to load your support tickets. Please refresh the page.",
      ),
    };
  }
}

/**
 * Get support requests for a specific center
 */
export async function getCenterSupportRequests(
  centerId: string,
): Promise<{ success: boolean; error?: string; data?: SupportRequest[] }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("support_requests")
      .select("*")
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching center support requests:", error);
      return {
        success: false,
        error: parseError(
          error,
          "Unable to load center support requests. Please refresh the page.",
        ),
      };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching center support requests:", error);
    return {
      success: false,
      error: parseError(
        error,
        "Unable to load center support requests. Please refresh the page.",
      ),
    };
  }
}
