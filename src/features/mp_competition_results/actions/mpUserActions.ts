"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * RPC get_unique_club_names を呼び出し、部活名の一覧を取得
 */
export async function getUniqueClubNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_unique_club_names");

  if (error) {
    console.error("get_unique_club_names error:", error);
    return [];
  }

  if (!Array.isArray(data)) return [];
  return data
    .map((row: unknown) => {
      if (typeof row === "string") return row;
      if (row && typeof row === "object" && "get_unique_club_names" in row) {
        return String((row as { get_unique_club_names: string }).get_unique_club_names);
      }
      if (row && typeof row === "object" && typeof (row as Record<string, unknown>).club_name === "string") {
        return String((row as { club_name: string }).club_name);
      }
      return String(row);
    })
    .filter(Boolean);
}

/**
 * ログインユーザーの mp_user_profiles.assigned_club を更新
 */
export async function updateUserAssignedClub(
  assignedClub: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("mp_user_profiles")
    .update({ assigned_club: assignedClub })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
