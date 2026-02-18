"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 正規化テーブル mp_clubs から部活名の一覧を取得（名前順・昇順）
 */
export async function getUniqueClubNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mp_clubs")
    .select("club_name")
    .order("club_name", { ascending: true });

  if (error) {
    console.error("mp_clubs fetch error:", error);
    return [];
  }

  if (!Array.isArray(data)) return [];
  return data
    .map((row: { club_name: string | null }) => row?.club_name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);
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
