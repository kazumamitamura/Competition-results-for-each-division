export type MpUserRole = "admin" | "teacher" | "student";

export interface MpUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: MpUserRole;
  /** 顧問が担当する部活名（卓球、バスケ等） */
  assigned_club: string | null;
  created_at: string;
  updated_at: string;
}

export interface MpSignupPayload {
  email: string;
  password: string;
  full_name: string;
  role: MpUserRole;
}
