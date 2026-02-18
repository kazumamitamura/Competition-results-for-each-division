"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpStudent, MpStudentFormData } from "../types";

function normalizeFormData(data: MpStudentFormData) {
  return {
    grade_class_num: data.grade_class_num.trim(),
    last_name: data.last_name.trim(),
    first_name: data.first_name.trim(),
    last_kana: data.last_kana.trim() || null,
    first_kana: data.first_kana.trim() || null,
    club_name: data.club_name.trim(),
    club_name_2: data.club_name_2.trim() || null,
  };
}

function validateFormData(data: ReturnType<typeof normalizeFormData>): string | null {
  if (!data.grade_class_num) return "学年クラス番号を入力してください";
  if (!data.last_name) return "姓を入力してください";
  if (!data.first_name) return "名を入力してください";
  if (!data.club_name) return "所属部活1を選択してください";
  return null;
}

/**
 * 新規生徒を作成する。club_name はフォームで指定（初期値は UI で assignedClub をセット）
 */
export async function mpCreateStudent(
  data: MpStudentFormData
): Promise<{ error?: string; data?: MpStudent }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const normalized = normalizeFormData(data);
  const err = validateFormData(normalized);
  if (err) return { error: err };

  const { data: row, error } = await supabase
    .from("mp_students")
    .insert({
      grade_class_num: normalized.grade_class_num,
      last_name: normalized.last_name,
      first_name: normalized.first_name,
      last_kana: normalized.last_kana,
      first_kana: normalized.first_kana,
      club_name: normalized.club_name,
      club_name_2: normalized.club_name_2,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: row as MpStudent };
}

/**
 * 既存生徒を更新（部活変更・兼部の追加・削除を含む）
 */
export async function mpUpdateStudent(
  studentId: string,
  data: MpStudentFormData
): Promise<{ error?: string; data?: MpStudent }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const normalized = normalizeFormData(data);
  const err = validateFormData(normalized);
  if (err) return { error: err };

  const { data: row, error } = await supabase
    .from("mp_students")
    .update({
      grade_class_num: normalized.grade_class_num,
      last_name: normalized.last_name,
      first_name: normalized.first_name,
      last_kana: normalized.last_kana,
      first_kana: normalized.first_kana,
      club_name: normalized.club_name,
      club_name_2: normalized.club_name_2,
    })
    .eq("id", studentId)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: row as MpStudent };
}

/**
 * 生徒を削除する
 */
export async function mpDeleteStudent(studentId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase.from("mp_students").delete().eq("id", studentId);

  if (error) return { error: error.message };
  return {};
}
