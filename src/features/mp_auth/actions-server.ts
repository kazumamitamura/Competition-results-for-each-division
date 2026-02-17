"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpUserProfile } from "./types";

/**
 * ログイン中ユーザーのプロフィール（assigned_club 含む）を取得する Server Action。
 * クライアントコンポーネントから呼び出し可能。以降の機能で部活スコープに利用する。
 */
export async function mpGetMyProfile(): Promise<MpUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("mp_user_profiles")
    .select("id, email, full_name, role, assigned_club, created_at, updated_at")
    .eq("id", user.id)
    .single();

  return profile as MpUserProfile | null;
}
