export type MemberRole = "owner" | "admin" | "examiner";

export interface CenterMember {
  membership_id?: string;
  user_id: string;
  center_id: string;
  full_name: string;
  email: string;
  role: MemberRole;
  is_active: boolean;
  joined_at: string;
  updated_at?: string;
  isOwner: boolean;
}
