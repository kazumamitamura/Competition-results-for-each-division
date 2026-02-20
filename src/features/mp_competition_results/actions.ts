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
  specialPrizes?: string,
  date?: string,
  endDate?: string,
  isSignboardRequested?: boolean
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
    date?: string | null;
    end_date?: string | null;
    is_signboard_requested?: boolean;
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
  if (date?.trim()) {
    insertData.date = date.trim();
  }
  if (endDate?.trim()) {
    insertData.end_date = endDate.trim();
  } else if (date?.trim()) {
    insertData.end_date = date.trim();
  }
  if (isSignboardRequested === true) {
    insertData.is_signboard_requested = true;
  }

  const { data, error } = await supabase
    .from("mp_competition_results")
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: data as MpCompetitionResult };
}

/**
 * 個人戦の成績を複数レコードとして保存（1人1レコード）
 */
export async function mpSaveIndividualCompetitionResults(
  competitionName: string,
  entries: Array<{ studentId: string; studentName: string; result: string }>,
  clubName: string,
  specialPrizes?: string,
  date?: string,
  endDate?: string,
  isSignboardRequested?: boolean
): Promise<{ error?: string; saved?: number; firstId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (entries.length === 0) {
    return { error: "出場選手を1名以上入力してください" };
  }

  const resolvedEndDate = endDate?.trim() || date?.trim() || null;
  const resolvedDate = date?.trim() || null;

  const insertData = entries
    .filter((e) => e.studentName.trim() && e.result.trim())
    .map((entry) => {
      const payload: MpCompetitionResult["payload"] = {
        type: "individual",
        entries: [
          {
            student_name: entry.studentName.trim(),
            result: entry.result.trim(),
          },
        ],
      };

      const row: {
        profile_id: string;
        club_name: string;
        competition_name: string;
        division: "individual";
        payload: MpCompetitionResult["payload"];
        special_prizes?: string;
        date?: string | null;
        end_date?: string | null;
        is_signboard_requested?: boolean;
      } = {
        profile_id: user.id,
        club_name: clubName,
        competition_name: competitionName,
        division: "individual",
        payload,
      };

      if (specialPrizes?.trim()) {
        row.special_prizes = specialPrizes.trim();
      }
      if (resolvedDate) row.date = resolvedDate;
      if (resolvedEndDate) row.end_date = resolvedEndDate;
      if (isSignboardRequested === true) {
        row.is_signboard_requested = true;
      }

      return row;
    });

  if (insertData.length === 0) {
    return { error: "有効な出場選手と成績を入力してください" };
  }

  const { data: inserted, error } = await supabase
    .from("mp_competition_results")
    .insert(insertData)
    .select("id");

  if (error) return { error: error.message };
  const firstId = Array.isArray(inserted) && inserted.length > 0 ? inserted[0].id : undefined;
  return { saved: insertData.length, firstId };
}

/**
 * 大会成績を1件更新（ダッシュボード編集用）
 */
export async function mpUpdateCompetitionResult(
  id: string,
  updates: {
    competition_name?: string | null;
    date?: string | null;
    end_date?: string | null;
    payload?: MpCompetitionResult["payload"];
    special_prizes?: string | null;
  }
): Promise<{ error?: string; data?: MpCompetitionResult }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const updateData: Record<string, unknown> = {};
  if (updates.competition_name !== undefined) updateData.competition_name = updates.competition_name;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
  if (updates.payload !== undefined) updateData.payload = updates.payload;
  if (updates.special_prizes !== undefined) updateData.special_prizes = updates.special_prizes;

  if (Object.keys(updateData).length === 0) {
    return { error: "更新する項目がありません" };
  }

  const { data, error } = await supabase
    .from("mp_competition_results")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: data as MpCompetitionResult };
}
