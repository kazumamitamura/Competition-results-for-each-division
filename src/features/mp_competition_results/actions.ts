"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpStudent, MpCompetitionResult } from "./types";

/**
 * ログインユーザーの担当部活の生徒一覧を取得
 */
export async function mpGetStudents(): Promise<MpStudent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("mp_user_profiles")
    .select("assigned_club")
    .eq("id", user.id)
    .single();

  if (!profile?.assigned_club) return [];

  const { data: students } = await supabase
    .from("mp_students")
    .select("*")
    .eq("club_name", profile.assigned_club)
    .order("last_kana", { ascending: true, nullsFirst: false })
    .order("first_kana", { ascending: true, nullsFirst: false });

  return (students as MpStudent[]) || [];
}

/**
 * 大会成績を保存
 */
export async function mpSaveCompetitionResult(
  competitionName: string,
  division: "team" | "individual",
  payload: MpCompetitionResult["payload"],
  clubName: string
): Promise<{ error?: string; data?: MpCompetitionResult }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data, error } = await supabase
    .from("mp_competition_results")
    .insert({
      profile_id: user.id,
      club_name: clubName,
      competition_name: competitionName,
      division,
      payload,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: data as MpCompetitionResult };
}
