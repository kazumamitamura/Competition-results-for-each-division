"use server";

import { createClient } from "@/lib/supabase/server";
import type { MpNotification } from "../types";

/**
 * ログイン中のユーザーの未読通知を日付降順で取得
 */
export async function getUnreadNotifications(): Promise<MpNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("mp_notifications")
    .select("id, user_id, message, is_read, created_at")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUnreadNotifications error:", error);
    return [];
  }

  return (data as MpNotification[]) || [];
}

/**
 * 指定した通知を既読にする
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("mp_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/**
 * 看板製作依頼通知を is_signboard_manager = true の全ユーザーに作成し、
 * 該当大会成績の is_signboard_requested を true に更新する
 */
export async function createSignboardRequestNotification(
  competitionId: string,
  clubName: string,
  competitionName: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: signboardManagers, error: fetchError } = await supabase
    .from("mp_user_profiles")
    .select("id")
    .eq("is_signboard_manager", true);

  if (fetchError) {
    console.error("createSignboardRequestNotification fetch error:", fetchError);
    return { error: fetchError.message };
  }

  const userIds = (signboardManagers ?? [])
    .map((row: { id: string }) => row.id)
    .filter(Boolean);

  if (userIds.length === 0) {
    return {};
  }

  const message = `【看板依頼】${clubName}から${competitionName}の看板製作依頼が届きました。`;
  const rows = userIds.map((userId: string) => ({
    user_id: userId,
    message,
    is_read: false,
  }));

  const { error: insertError } = await supabase
    .from("mp_notifications")
    .insert(rows);

  if (insertError) {
    console.error("createSignboardRequestNotification insert error:", insertError);
    return { error: insertError.message };
  }

  const { error: updateError } = await supabase
    .from("mp_competition_results")
    .update({ is_signboard_requested: true })
    .eq("id", competitionId);

  if (updateError) {
    console.error("createSignboardRequestNotification update error:", updateError);
    return { error: updateError.message };
  }

  return {};
}
