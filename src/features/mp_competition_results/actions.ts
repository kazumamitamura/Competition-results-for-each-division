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

  const assigned = profile.assigned_club;
  const { data: students } = await supabase
    .from("mp_students")
    .select("*")
    .or(`club_name.eq.${assigned},club_name_2.eq.${assigned}`)
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
  clubName: string,
  specialPrizes?: string
): Promise<{ error?: string; data?: MpCompetitionResult }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const insertData: {
    profile_id: string;
    club_name: string;
    competition_name: string;
    division: "team" | "individual";
    payload: MpCompetitionResult["payload"];
    special_prizes?: string;
  } = {
    profile_id: user.id,
    club_name: clubName,
    competition_name: competitionName,
    division,
    payload,
  };

  if (specialPrizes?.trim()) {
    insertData.special_prizes = specialPrizes.trim();
  }

  const { data, error } = await supabase
    .from("mp_competition_results")
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: data as MpCompetitionResult };
}
