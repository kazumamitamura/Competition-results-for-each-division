"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpStudent, MpStudentFormData } from "../types";

/** 部活割り当てモーダル用: 全校生徒の検索・一覧（ページネーション） */
export async function mpGetAllStudentsForAssignment(options: {
  grade_class_num?: string;
  name?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: MpStudent[]; total: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], total: 0 };

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("mp_students")
    .select("id, grade_class_num, last_name, first_name, last_kana, first_kana, club_name, club_name_2, created_at, updated_at", { count: "exact" })
    .order("last_kana", { ascending: true, nullsFirst: false })
    .order("first_kana", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (options.grade_class_num?.trim()) {
    query = query.ilike("grade_class_num", `%${options.grade_class_num.trim()}%`);
  }
  if (options.name?.trim()) {
    const n = options.name.trim();
    query = query.or(`last_name.ilike.%${n}%,first_name.ilike.%${n}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("mpGetAllStudentsForAssignment error:", error);
    return { data: [], total: 0 };
  }
  return { data: (data as MpStudent[]) ?? [], total: count ?? 0 };
}

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

/**
 * 指定生徒を targetClub に割り当てる。
 * club_name が空ならそこに、埋まっていれば club_name_2 が空ならそこに登録。
 * 既にその部活に入っている場合はスキップ。両方埋まっている場合はスキップ。
 */
export async function mpAssignStudentsToClub(
  studentIds: string[],
  targetClub: string
): Promise<{ error?: string; assigned?: number; skipped?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
  if (!targetClub?.trim()) return { error: "部活を指定してください" };
  if (!studentIds.length) return { assigned: 0, skipped: 0 };

  const club = targetClub.trim();
  let assigned = 0;
  let skipped = 0;

  for (const id of studentIds) {
    const { data: row, error: fetchError } = await supabase
      .from("mp_students")
      .select("id, club_name, club_name_2")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      skipped += 1;
      continue;
    }

    const current1 = (row.club_name ?? "").trim();
    const current2 = (row.club_name_2 ?? "").trim();
    if (current1 === club || current2 === club) {
      skipped += 1;
      continue;
    }

    let updatePayload: { club_name?: string; club_name_2?: string | null } = {};
    if (!current1) {
      updatePayload.club_name = club;
    } else if (!current2) {
      updatePayload.club_name_2 = club;
    } else {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("mp_students")
      .update(updatePayload)
      .eq("id", id);

    if (!updateError) assigned += 1;
    else skipped += 1;
  }

  return { assigned, skipped };
}

/**
 * 指定生徒から targetClub を削除する。
 * 自動繰り上げ: club_name を削除した場合は club_name_2 を club_name に移動し club_name_2 を NULL に。
 */
export async function mpRemoveStudentsFromClub(
  studentIds: string[],
  targetClub: string
): Promise<{ error?: string; removed?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
  if (!targetClub?.trim()) return { error: "部活を指定してください" };
  if (!studentIds.length) return { removed: 0 };

  const club = targetClub.trim();
  let removed = 0;

  for (const id of studentIds) {
    const { data: row, error: fetchError } = await supabase
      .from("mp_students")
      .select("id, club_name, club_name_2")
      .eq("id", id)
      .single();

    if (fetchError || !row) continue;

    const current1 = (row.club_name ?? "").trim();
    const current2 = (row.club_name_2 ?? "").trim();

    // 自動繰り上げ: club_name 削除時は club_name_2 を前に詰める。NOT NULL 対応で空きは '' に。
    let updatePayload: { club_name: string; club_name_2: string | null };

    if (current1 === club) {
      if (current2) {
        updatePayload = { club_name: current2, club_name_2: null };
      } else {
        updatePayload = { club_name: "", club_name_2: null };
      }
    } else if (current2 === club) {
      updatePayload = { club_name: current1 || "", club_name_2: null };
    } else {
      continue;
    }

    const { error: updateError } = await supabase
      .from("mp_students")
      .update(updatePayload)
      .eq("id", id);

    if (!updateError) removed += 1;
  }

  return { removed };
}

/**
 * 指定生徒の targetClub 所属を newClub に変更する（上書き）。
 */
export async function mpChangeStudentsClub(
  studentIds: string[],
  targetClub: string,
  newClub: string
): Promise<{ error?: string; updated?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
  if (!targetClub?.trim()) return { error: "変更元の部活を指定してください" };
  if (!newClub?.trim()) return { error: "変更先の部活を指定してください" };
  if (!studentIds.length) return { updated: 0 };

  const fromClub = targetClub.trim();
  const toClub = newClub.trim();
  let updated = 0;

  for (const id of studentIds) {
    const { data: row, error: fetchError } = await supabase
      .from("mp_students")
      .select("id, club_name, club_name_2")
      .eq("id", id)
      .single();

    if (fetchError || !row) continue;

    const current1 = (row.club_name ?? "").trim();
    const current2 = (row.club_name_2 ?? "").trim();

    let updatePayload: { club_name?: string | null; club_name_2?: string | null };
    if (current1 === fromClub) {
      updatePayload = { club_name: toClub };
    } else if (current2 === fromClub) {
      updatePayload = { club_name_2: toClub };
    } else {
      continue;
    }

    const { error: updateError } = await supabase
      .from("mp_students")
      .update(updatePayload)
      .eq("id", id);

    if (!updateError) updated += 1;
  }

  return { updated };
}
