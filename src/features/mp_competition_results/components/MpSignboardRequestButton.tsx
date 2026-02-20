"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSignboardRequestNotification } from "../actions/mpNotificationActions";

interface MpSignboardRequestButtonProps {
  competitionId: string;
  clubName: string;
  competitionName: string;
  isRequested: boolean;
  /** 依頼送信成功後に呼ばれ、一覧の再取得に使う */
  onSuccess?: () => void;
}

export function MpSignboardRequestButton({
  competitionId,
  clubName,
  competitionName,
  isRequested,
  onSuccess,
}: MpSignboardRequestButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (isRequested || isSubmitting) return;

    const confirmed = window.confirm(
      "【確認】この大会の看板製作依頼を担当者へ送信しますか？"
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const result = await createSignboardRequestNotification(
        competitionId,
        clubName,
        competitionName || "（大会名なし）"
      );
      if (result.error) {
        alert(`依頼の送信に失敗しました: ${result.error}`);
        return;
      }
      router.refresh();
      onSuccess?.();
      alert("看板製作の依頼を送信しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRequested) {
    return (
      <button
        type="button"
        disabled
        className="mp-dashboard-signboard-btn mp-dashboard-signboard-btn-disabled"
        aria-label="依頼済み"
      >
        ✅ 依頼済み
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      className="mp-dashboard-signboard-btn mp-dashboard-signboard-btn-active"
      aria-label={isSubmitting ? "送信中" : "看板製作を依頼する"}
    >
      {isSubmitting ? "送信中..." : "📢 看板依頼"}
    </button>
  );
}
