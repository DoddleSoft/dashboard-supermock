import { createClient } from "@/lib/supabase/client";
import { CenterMember } from "@/types/member";
import { toast } from "sonner";

const supabase = createClient();

const hashPasscode = async (passcode: string) => {
  if (!passcode) return "";

  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};


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
    toast.error("Failed to load members");
    throw error;
  }
};

export const createCenterMember = async (
  centerId: string,
  data: {
    full_name: string;
    email: string;
    role: "admin" | "examiner";
    passcode: string;
  },
) => {
  try {
    const code_hash = await hashPasscode(data.passcode);

    // Upsert into exchange_codes — the user will join via the exchange-code page.
    // We no longer pre-create a fake user_id or insert directly into center_members.
    const { error: codeError } = await supabase
      .from("exchange_codes")
      .upsert(
        {
          email: data.email,
          role: data.role,
          passcode_hash: code_hash,
          center_id: centerId,
        },
        { onConflict: "email" },
      );

    if (codeError) throw codeError;

    toast.success(
      `Invite created for ${data.email}. They can now register and use this passcode to join.`,
    );
  } catch (error: any) {
    console.error("Error creating member invite:", error);

    if (error.message?.includes("duplicate key")) {
      toast.error("An invite already exists for this email");
    } else {
      toast.error("Failed to create invite");
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
    toast.error("Failed to update member");
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
    toast.error("Failed to remove member");
    throw error;
  }
};
