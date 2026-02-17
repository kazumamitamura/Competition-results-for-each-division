"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMpStudentSelection } from "./MpStudentSelectionContext";
import { mpSaveCompetitionResult } from "./actions";
import { useMpProfile } from "@/features/mp_auth";
import type { MpTeamPayload, MpIndividualPayload } from "./types";

type MpDivision = "team" | "individual";

interface MpResultFormData {
  competitionName: string;
  division: MpDivision;
  members: string; // 「三村(3-1), 友野(3-2)」形式
  score?: string;
  rank?: string;
  opponent?: string;
  round?: string;
}

export function MpResultForm() {
  const { profile, assignedClub, isLoading: profileLoading } = useMpProfile();
  const { selectedStudents, formatAllSelected, clearSelection } =
    useMpStudentSelection();
  const [division, setDivision] = useState<MpDivision>("team");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MpResultFormData>({
    defaultValues: {
      competitionName: "",
      division: "team",
      members: "",
      score: "",
      rank: "",
      opponent: "",
      round: "",
    },
  });

  // 選択した生徒をメンバー欄に自動挿入
  useEffect(() => {
    if (selectedStudents.length > 0) {
      const formatted = formatAllSelected();
      setValue("members", formatted);
    }
  }, [selectedStudents, formatAllSelected, setValue]);

  // 団体/個人切り替え時にフォームをリセット
  useEffect(() => {
    reset({
      competitionName: watch("competitionName"),
      division,
      members: "",
      score: "",
      rank: "",
      opponent: "",
      round: "",
    });
    clearSelection();
  }, [division, reset, watch, clearSelection]);

  async function onSubmit(data: MpResultFormData) {
    if (!assignedClub) {
      setSubmitError("担当部活が設定されていません");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    let payload: MpTeamPayload | MpIndividualPayload;

    if (division === "team") {
      // 団体戦: members を配列に分割
      const membersArray = data.members
        .split("、")
        .map((m) => m.trim())
        .filter(Boolean);

      payload = {
        type: "team",
        members: membersArray,
        score: data.score || undefined,
        rank: data.rank || undefined,
        opponent: data.opponent || undefined,
        round: data.round || undefined,
      };
    } else {
      // 個人戦: members を個別エントリに分割
      const entries = data.members
        .split("、")
        .map((m) => m.trim())
        .filter(Boolean)
        .map((studentName) => ({
          student_name: studentName,
          score: data.score || undefined,
          rank: data.rank || undefined,
        }));

      payload = {
        type: "individual",
        entries,
      };
    }

    const result = await mpSaveCompetitionResult(
      data.competitionName,
      division,
      payload,
      assignedClub
    );

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setSubmitSuccess(true);
    reset();
    clearSelection();
    setTimeout(() => setSubmitSuccess(false), 3000);
  }

  if (profileLoading) {
    return (
      <div className="mp-app-container mp-result-form">
        <div className="mp-result-form-loading">読み込み中...</div>
      </div>
    );
  }

  if (!assignedClub) {
    return (
      <div className="mp-app-container mp-result-form">
        <div className="mp-result-form-error" role="alert">
          担当部活が設定されていません。プロフィールで設定してください。
        </div>
      </div>
    );
  }

  return (
    <div className="mp-app-container mp-result-form">
      <h1 className="mp-result-form-title">大会成績入力</h1>

      {/* 団体/個人切り替えトグル */}
      <div className="mp-result-form-toggle">
        <button
          type="button"
          onClick={() => setDivision("team")}
          className={`mp-result-form-toggle-button ${
            division === "team" ? "mp-result-form-toggle-button-active" : ""
          }`}
        >
          団体戦
        </button>
        <button
          type="button"
          onClick={() => setDivision("individual")}
          className={`mp-result-form-toggle-button ${
            division === "individual" ? "mp-result-form-toggle-button-active" : ""
          }`}
        >
          個人戦
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mp-result-form-form">
        {submitError && (
          <div className="mp-result-form-error" role="alert">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mp-result-form-success" role="alert">
            成績を保存しました
          </div>
        )}

        <div className="mp-result-form-field">
          <label htmlFor="mp-competition-name" className="mp-result-form-label">
            大会名
          </label>
          <input
            id="mp-competition-name"
            type="text"
            className="mp-result-form-input"
            {...register("competitionName", {
              required: "大会名を入力してください",
            })}
          />
          {errors.competitionName && (
            <span className="mp-result-form-error-text">
              {errors.competitionName.message}
            </span>
          )}
        </div>

        <div className="mp-result-form-field">
          <label htmlFor="mp-members" className="mp-result-form-label">
            メンバー（右側の名簿から選択すると自動入力されます）
          </label>
          <textarea
            id="mp-members"
            rows={3}
            className="mp-result-form-textarea"
            placeholder="三村(2-1-15)、友野(3-2-8)"
            {...register("members", {
              required: "メンバーを入力してください",
            })}
          />
          {errors.members && (
            <span className="mp-result-form-error-text">
              {errors.members.message}
            </span>
          )}
        </div>

        {division === "team" && (
          <>
            <div className="mp-result-form-field">
              <label htmlFor="mp-round" className="mp-result-form-label">
                ラウンド（例: 1回戦、準決勝）
              </label>
              <input
                id="mp-round"
                type="text"
                className="mp-result-form-input"
                {...register("round")}
              />
            </div>

            <div className="mp-result-form-field">
              <label htmlFor="mp-opponent" className="mp-result-form-label">
                対戦相手
              </label>
              <input
                id="mp-opponent"
                type="text"
                className="mp-result-form-input"
                {...register("opponent")}
              />
            </div>
          </>
        )}

        <div className="mp-result-form-field">
          <label htmlFor="mp-score" className="mp-result-form-label">
            スコア
          </label>
          <input
            id="mp-score"
            type="text"
            className="mp-result-form-input"
            {...register("score")}
          />
        </div>

        <div className="mp-result-form-field">
          <label htmlFor="mp-rank" className="mp-result-form-label">
            順位
          </label>
          <input
            id="mp-rank"
            type="text"
            className="mp-result-form-input"
            {...register("rank")}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mp-result-form-submit"
        >
          {isSubmitting ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
