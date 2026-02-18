"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpCompetitionResult } from "../types";
import { getAcademicYearStart, getAcademicYearEnd } from "../utils/academicYear";

export interface MpDashboardFilters {
  academicYear?: number;
  clubName?: string; // "全活動" の場合は undefined
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

/**
 * ダッシュボード用: 大会成績を検索・取得
 */
export async function mpGetCompetitionResults(
  filters: MpDashboardFilters
): Promise<MpCompetitionResult[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("mp_competition_results")
    .select("*")
    .order("created_at", { ascending: false });

  // 年度フィルター
  if (filters.academicYear !== undefined) {
    const start = getAcademicYearStart(filters.academicYear);
    const end = getAcademicYearEnd(filters.academicYear);
    query = query
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());
  }

  // 期間フィルター（年度より優先）
  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  }

  // 部活動フィルター
  if (filters.clubName && filters.clubName !== "全活動") {
    query = query.eq("club_name", filters.clubName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("mpGetCompetitionResults error:", error);
    return [];
  }

  return (data as MpCompetitionResult[]) || [];
}
