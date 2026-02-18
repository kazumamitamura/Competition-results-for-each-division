"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMpStudentSelection } from "./MpStudentSelectionContext";
import { mpSaveCompetitionResult } from "./actions";
import { useMpProfile } from "@/features/mp_auth";
import type { MpTeamPayload, MpIndividualPayload } from "./types";

const INITIAL_MEMBER_ROWS = 5;
const MAX_MEMBER_ROWS = 20;

type MpDivision = "team" | "individual";

interface MpResultFormData {
  competitionName: string;
  division: MpDivision;
  members: string[]; // メンバー名の配列
  specialPrizes?: string; // 特別賞 / 備考
  score?: string;
  rank?: string;
  opponent?: string;
  round?: string;
}

export function MpResultForm() {
  const { profile, assignedClub, isLoading: profileLoading } = useMpProfile();
  const { selectedStudents, formatStudentForForm, clearSelection } =
    useMpStudentSelection();
  const [division, setDivision] = useState<MpDivision>("team");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [memberRows, setMemberRows] = useState<string[]>(
    Array(INITIAL_MEMBER_ROWS).fill("")
  );

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
      members: Array(INITIAL_MEMBER_ROWS).fill(""),
      specialPrizes: "",
      score: "",
      rank: "",
      opponent: "",
      round: "",
    },
  });

  // 選択した生徒をメンバー欄に自動挿入（上から順に空欄を埋める）
  useEffect(() => {
    if (selectedStudents.length > 0) {
      const currentMembers = watch("members") || [];
      const newMembers = [...currentMembers];
      let insertIndex = 0;
      for (const student of selectedStudents) {
        const formatted = formatStudentForForm(student);
        // 空欄を探して埋める
        while (insertIndex < newMembers.length && newMembers[insertIndex]?.trim()) {
          insertIndex++;
        }
        if (insertIndex < MAX_MEMBER_ROWS) {
          if (insertIndex >= newMembers.length) {
            newMembers.push(formatted);
          } else {
            newMembers[insertIndex] = formatted;
          }
          insertIndex++;
        }
      }
      setValue("members", newMembers);
      setMemberRows(newMembers);
    }
  }, [selectedStudents, formatStudentForForm, setValue, watch]);

  // 団体/個人切り替え時にフォームをリセット
  useEffect(() => {
    const emptyMembers = Array(INITIAL_MEMBER_ROWS).fill("");
    reset({
      competitionName: watch("competitionName"),
      division,
      members: emptyMembers,
      specialPrizes: "",
      score: "",
      rank: "",
      opponent: "",
      round: "",
    });
    setMemberRows(emptyMembers);
    clearSelection();
  }, [division, reset, watch, clearSelection]);

  const addMemberRow = () => {
    if (memberRows.length >= MAX_MEMBER_ROWS) return;
    const newRows = [...memberRows, ""];
    setMemberRows(newRows);
    setValue("members", newRows);
  };

  const updateMemberRow = (index: number, value: string) => {
    const newRows = [...memberRows];
    newRows[index] = value;
    setMemberRows(newRows);
    setValue("members", newRows);
  };

  async function onSubmit(data: MpResultFormData) {
    if (!assignedClub) {
      setSubmitError("担当部活が設定されていません");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    // メンバー名の配列をフィルタ（空文字を除外）
    const membersArray = (data.members || []).map((m) => m.trim()).filter(Boolean);
    if (membersArray.length === 0) {
      setSubmitError("メンバーを1名以上入力してください");
      return;
    }

    let payload: MpTeamPayload | MpIndividualPayload;

    if (division === "team") {
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
      const entries = membersArray.map((studentName) => ({
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
      assignedClub,
      data.specialPrizes?.trim() || undefined
    );

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setSubmitSuccess(true);
    const emptyMembers = Array(INITIAL_MEMBER_ROWS).fill("");
    reset({
      competitionName: "",
      division,
      members: emptyMembers,
      specialPrizes: "",
      score: "",
      rank: "",
      opponent: "",
      round: "",
    });
    setMemberRows(emptyMembers);
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

        {/* 出場メンバー入力セクション */}
        <div className="mp-result-form-section">
          <label className="mp-result-form-label">出場メンバー</label>
          <div className="mp-result-form-members-list">
            {memberRows.map((member, index) => (
              <div key={index} className="mp-result-form-member-row">
                <span className="mp-result-form-member-number">{index + 1}.</span>
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMemberRow(index, e.target.value)}
                  className="mp-result-form-input mp-result-form-member-input"
                  placeholder="名前を入力"
                />
              </div>
            ))}
          </div>
          {memberRows.length < MAX_MEMBER_ROWS && (
            <button
              type="button"
              onClick={addMemberRow}
              className="mp-result-form-add-member-btn"
            >
              ＋ メンバーを追加
            </button>
          )}
          {memberRows.length >= MAX_MEMBER_ROWS && (
            <p className="mp-result-form-member-limit">（最大{MAX_MEMBER_ROWS}名まで）</p>
          )}
        </div>

        {/* 特別賞 / 備考入力セクション */}
        <div className="mp-result-form-field">
          <label htmlFor="mp-special-prizes" className="mp-result-form-label">
            特別賞 / 備考 (MVPなど)
          </label>
          <textarea
            id="mp-special-prizes"
            rows={4}
            className="mp-result-form-textarea"
            placeholder="MVP: 田中太郎, 敢闘賞: 鈴木一郎"
            {...register("specialPrizes")}
          />
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
