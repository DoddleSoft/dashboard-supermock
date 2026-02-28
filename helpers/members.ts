import { createClient } from "@/lib/supabase/client";
import { CenterMember } from "@/types/member";
import { toast } from "sonner";
import { parseError } from "@/lib/utils";

const supabase = createClient();

export const fetchCenterMembers = async (
  centerId: string,
  ownerId: string,
): Promise<CenterMember[]> => {
  try {
    const { data: memberRows, error: memberError } = await supabase
      .from("center_members")
      .select(
        "membership_id, center_id, user_id, invited_at, users (user_id, email, role, full_name, is_active, created_at, updated_at)",
      )
      .eq("center_id", centerId)
      .order("invited_at", { ascending: false });

    if (memberError) throw memberError;

    const members: CenterMember[] = (memberRows || [])
      .map((row: any) => {
        const user = row.users;
        if (!user) return null;

        return {
          membership_id: row.membership_id,
          user_id: row.user_id,
          center_id: row.center_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          is_active: user.is_active ?? true,
          joined_at: row.invited_at || user.created_at,
          updated_at: user.updated_at,
          isOwner: false,
        } as CenterMember;
      })
      .filter(Boolean) as CenterMember[];

    const { data: ownerProfile, error: ownerError } = await supabase
      .from("users")
      .select("user_id, email, full_name, is_active, created_at, updated_at")
      .eq("user_id", ownerId)
      .single();

    if (ownerError) {
      console.error("Error fetching owner profile:", ownerError);
    }

    const ownerMember: CenterMember | null = ownerProfile
      ? {
          membership_id: undefined,
          user_id: ownerProfile.user_id,
          center_id: centerId,
          full_name: ownerProfile.full_name,
          email: ownerProfile.email,
          role: "owner",
          is_active: ownerProfile.is_active ?? true,
          joined_at: ownerProfile.created_at,
          updated_at: ownerProfile.updated_at,
          isOwner: true,
        }
      : null;

    const filteredMembers = members.filter(
      (member) => member.user_id !== ownerId,
    );

    return ownerMember ? [ownerMember, ...filteredMembers] : filteredMembers;
  } catch (error) {
    console.error("Error fetching members:", error);
    toast.error(
      parseError(
        error,
        "Unable to load center members. Please refresh the page.",
      ),
    );
    throw error;
  }
};

export const createCenterMember = async (
  centerId: string,
  data: {
    full_name: string;
    email: string;
    role: "admin" | "examiner";
    password: string;
  },
) => {
  try {
    // Client-side pre-validation (mirrors server)
    if (!data.full_name?.trim()) {
      toast.error("Full name is required.");
      throw new Error("validation");
    }
    const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRe.test(data.email?.trim() ?? "")) {
      toast.error("Please enter a valid email address.");
      throw new Error("validation");
    }
    const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRe.test(data.password)) {
      toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      );
      throw new Error("validation");
    }

    const res = await fetch("/api/create/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        center_id: centerId,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to add member.");
      throw new Error(json.error ?? "api error");
    }

    toast.success(`${data.full_name} has been added as a ${data.role}.`);
    return json.membership;
  } catch (error: any) {
    if (error.message !== "validation" && error.message !== "api error") {
      console.error("Error creating member:", error);
      toast.error(
        parseError(error, "Failed to add the team member. Please try again."),
      );
    }
    throw error;
  }
};

export const updateCenterMember = async (
  userId: string,
  updateData: {
    full_name?: string;
    email?: string;
    role?: "admin" | "examiner";
    is_active?: boolean;
  },
) => {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        full_name: updateData.full_name,
        email: updateData.email,
        role: updateData.role,
        is_active: updateData.is_active,
      })
      .eq("user_id", userId);

    if (error) throw error;

    toast.success("Member updated successfully!");
  } catch (error: any) {
    console.error("Error updating member:", error);
    toast.error(
      parseError(error, "Failed to save member changes. Please try again."),
    );
    throw error;
  }
};

export const deleteCenterMember = async (centerId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from("center_members")
      .delete()
      .eq("center_id", centerId)
      .eq("user_id", userId);

    if (error) throw error;

    toast.success("Member removed successfully!");
  } catch (error: any) {
    console.error("Error removing member:", error);
    toast.error(
      parseError(error, "Failed to remove the member. Please try again."),
    );
    throw error;
  }
};
