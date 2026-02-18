"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMpStudentSelection } from "./MpStudentSelectionContext";
import { mpSaveCompetitionResult, mpSaveIndividualCompetitionResults } from "./actions";
import { useMpProfile } from "@/features/mp_auth";
import type { MpTeamPayload, MpIndividualPayload } from "./types";
import type { MpStudent } from "./types";

const INITIAL_MEMBER_ROWS = 5;
const MAX_MEMBER_ROWS = 20;

type MpDivision = "team" | "individual";

interface MpResultFormData {
  competitionName: string;
  division: MpDivision;
  members: string[]; // 団体戦用: メンバー名の配列
  specialPrizes?: string; // 特別賞 / 備考
  score?: string;
  rank?: string;
  opponent?: string;
  round?: string;
}

interface IndividualEntry {
  studentId: string;
  studentName: string; // 「grade_class_num last_name first_name」形式
  result: string;
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
  const [individualEntries, setIndividualEntries] = useState<IndividualEntry[]>([]);

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

  // 団体戦: 選択した生徒をメンバー欄に自動挿入（上から順に空欄を埋める）
  useEffect(() => {
    if (division === "team" && selectedStudents.length > 0) {
      const currentMembers = watch("members") || [];
      const newMembers = [...currentMembers];
      let insertIndex = 0;
      for (const student of selectedStudents) {
        const formatted = formatStudentForForm(student);
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
  }, [division, selectedStudents, formatStudentForForm, setValue, watch]);

  // 個人戦: 選択した生徒を個人成績リストに追加
  useEffect(() => {
    if (division === "individual" && selectedStudents.length > 0) {
      setIndividualEntries((prev) => {
        const existingIds = new Set(prev.map((e) => e.studentId));
        const newEntries: IndividualEntry[] = [];
        for (const student of selectedStudents) {
          if (!existingIds.has(student.id)) {
            newEntries.push({
              studentId: student.id,
              studentName: formatStudentForForm(student),
              result: "",
            });
          }
        }
        return [...prev, ...newEntries];
      });
      clearSelection();
    }
  }, [division, selectedStudents, formatStudentForForm, clearSelection]);

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
    setIndividualEntries([]);
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

  const addIndividualRow = () => {
    setIndividualEntries((prev) => [
      ...prev,
      { studentId: `new-${Date.now()}`, studentName: "", result: "" },
    ]);
  };

  const updateIndividualRow = (index: number, field: "studentName" | "result", value: string) => {
    setIndividualEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const removeIndividualRow = (index: number) => {
    setIndividualEntries((prev) => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: MpResultFormData) {
    if (!assignedClub) {
      setSubmitError("担当部活が設定されていません");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(false);

    if (division === "team") {
      // 団体戦: 既存のロジック
      const membersArray = (data.members || []).map((m) => m.trim()).filter(Boolean);
      if (membersArray.length === 0) {
        setSubmitError("メンバーを1名以上入力してください");
        return;
      }

      const payload: MpTeamPayload = {
        type: "team",
        members: membersArray,
        score: data.score || undefined,
        rank: data.rank || undefined,
        opponent: data.opponent || undefined,
        round: data.round || undefined,
      };

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
    } else {
      // 個人戦: 1人1レコードとして複数INSERT
      const validEntries = individualEntries.filter(
        (e) => e.studentName.trim() && e.result.trim()
      );
      if (validEntries.length === 0) {
        setSubmitError("出場選手と成績を1名以上入力してください");
        return;
      }

      const result = await mpSaveIndividualCompetitionResults(
        data.competitionName,
        validEntries,
        assignedClub,
        data.specialPrizes?.trim() || undefined
      );

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      setSubmitSuccess(true);
      reset({
        competitionName: "",
        division,
        members: Array(INITIAL_MEMBER_ROWS).fill(""),
        specialPrizes: "",
        score: "",
        rank: "",
        opponent: "",
        round: "",
      });
      setIndividualEntries([]);
      clearSelection();
    }

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

        {division === "team" && (
          <>
            {/* 団体戦: 出場メンバー入力セクション */}
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
          </>
        )}

        {division === "individual" && (
          <>
            {/* 個人戦: 出場選手・成績リスト */}
            <div className="mp-result-form-section">
              <label className="mp-result-form-label">出場選手・成績</label>
              <div className="mp-result-form-individual-list">
                {individualEntries.map((entry, index) => (
                  <div key={entry.studentId || index} className="mp-result-form-individual-row">
                    <span className="mp-result-form-individual-number">{index + 1}.</span>
                    <input
                      type="text"
                      value={entry.studentName}
                      onChange={(e) => updateIndividualRow(index, "studentName", e.target.value)}
                      className="mp-result-form-input mp-result-form-individual-name"
                      placeholder="生徒名（サイドバーから選択）"
                      readOnly={!!entry.studentId && !entry.studentId.startsWith("new-")}
                    />
                    <input
                      type="text"
                      value={entry.result}
                      onChange={(e) => updateIndividualRow(index, "result", e.target.value)}
                      className="mp-result-form-input mp-result-form-individual-result"
                      placeholder="成績（例: 優勝, 2回戦敗退）"
                    />
                    <button
                      type="button"
                      onClick={() => removeIndividualRow(index)}
                      className="mp-result-form-individual-remove"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addIndividualRow}
                className="mp-result-form-add-member-btn"
              >
                ＋ 生徒を追加
              </button>
            </div>

            {/* 特別賞 / 備考入力セクション */}
            <div className="mp-result-form-field">
              <label htmlFor="mp-special-prizes-individual" className="mp-result-form-label">
                特別賞 / 備考 (MVPなど)
              </label>
              <textarea
                id="mp-special-prizes-individual"
                rows={4}
                className="mp-result-form-textarea"
                placeholder="MVP: 田中太郎, 敢闘賞: 鈴木一郎"
                {...register("specialPrizes")}
              />
            </div>
          </>
        )}

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
