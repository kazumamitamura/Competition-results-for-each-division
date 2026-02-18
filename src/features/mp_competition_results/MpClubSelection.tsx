"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MpSignOutButton } from "@/features/mp_auth";
import { updateUserAssignedClub } from "./actions/mpUserActions";

interface MpClubSelectionProps {
  initialAssignedClub: string | null;
  clubNames: string[];
  userEmail: string;
}

export function MpClubSelection({
  initialAssignedClub,
  clubNames,
  userEmail,
}: MpClubSelectionProps) {
  const router = useRouter();
  const [showSelector, setShowSelector] = useState(!initialAssignedClub?.trim());
  const [selectedClub, setSelectedClub] = useState(initialAssignedClub ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!selectedClub.trim()) {
      setError("部活動を選択してください");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const result = await updateUserAssignedClub(selectedClub.trim());
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowSelector(false);
    router.refresh();
  }

  if (showSelector) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <p className="text-neutral-600">
          ログイン中: <strong className="text-neutral-900">{userEmail}</strong>
        </p>

        <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            担当する部活動を選択してください
          </h2>
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {clubNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {clubNames.length === 0 && (
            <p className="text-sm text-amber-600">
              部活データがありません。CSVで mp_students にデータをインポートしてください。
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleRegister}
            disabled={isSubmitting || !selectedClub.trim()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "登録中..." : "登録する"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-1">
        <p className="text-neutral-600">
          ログイン中: <strong className="text-neutral-900">{userEmail}</strong>
        </p>
        <p className="text-neutral-600">
          担当部活:{" "}
          <strong className="text-neutral-900">{initialAssignedClub}</strong>
          <button
            type="button"
            onClick={() => setShowSelector(true)}
            className="ml-2 text-sm text-blue-600 hover:text-blue-700 underline"
          >
            変更
          </button>
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/mp_competition_results"
            className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            大会成績入力システムを開く
          </Link>
          <Link
            href="/mp_dashboard"
            className="rounded-lg bg-neutral-700 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
          >
            管理者ダッシュボード（検索・出力）
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <MpSignOutButton />
          <Link
            href="/login"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            別アカウントでログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
