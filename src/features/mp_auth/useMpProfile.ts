"use client";

import { useState, useEffect, useCallback } from "react";
import { mpGetMyProfile } from "./actions-server";
import type { MpUserProfile } from "./types";

export interface UseMpProfileResult {
  profile: MpUserProfile | null;
  assignedClub: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ログイン中ユーザーのプロフィールと担当部活（assigned_club）を取得するフック。
 * 大会成績など、その部活のデータのみ扱う機能で利用する。
 */
export function useMpProfile(): UseMpProfileResult {
  const [profile, setProfile] = useState<MpUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mpGetMyProfile();
      setProfile(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "プロフィールの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    assignedClub: profile?.assigned_club ?? null,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
