"use client";

import { useState, useEffect, useCallback } from "react";
import { mpGetCompetitionResults, type MpDashboardFilters } from "./actions/mpDashboardActions";
import { mpUpdateCompetitionResult } from "./actions";
import { getAcademicYear, getAvailableAcademicYears, formatAcademicYear } from "./utils/academicYear";
import { exportToExcel } from "./utils/excelExport";
import type { MpCompetitionResult, MpCompetitionPayload } from "./types";

interface MpDashboardClientProps {
  clubOptions: string[];
}

function toYMD(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function MpDashboardClient({ clubOptions }: MpDashboardClientProps) {
  const currentYear = getAcademicYear();
  const availableYears = getAvailableAcademicYears();

  const [filters, setFilters] = useState<MpDashboardFilters>({
    academicYear: currentYear,
    clubName: "全活動",
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<MpCompetitionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<MpCompetitionResult | null>(null);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParams: MpDashboardFilters = {
        academicYear: filters.academicYear,
        clubName: filters.clubName === "全活動" ? undefined : filters.clubName,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const data = await mpGetCompetitionResults(filterParams);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [filters.academicYear, filters.clubName, dateFrom, dateTo]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleExport = () => {
    exportToExcel(results);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatMembers = (payload: MpCompetitionResult["payload"]) => {
    if (payload.type === "team") {
      return payload.members?.join(", ") || "";
    } else {
      return payload.entries?.map((e) => e.student_name).join(", ") || "";
    }
  };

  const formatScore = (payload: MpCompetitionResult["payload"]) => {
    if (payload.type === "team") {
      return payload.score || payload.rank || "";
    } else {
      return payload.entries?.[0]?.result ?? payload.entries?.[0]?.score ?? payload.entries?.[0]?.rank ?? "";
    }
  };

  const displayDate = (result: MpCompetitionResult) => {
    if (result.date) return formatDate(result.date);
    return formatDate(result.created_at);
  };

  return (
    <div className="mp-dashboard-layout">
      {/* 検索フィルター */}
      <aside className="mp-dashboard-filters">
        <h2 className="mp-dashboard-filters-title">検索条件</h2>
        <div className="mp-dashboard-filters-content">
          <div className="mp-dashboard-filter-field">
            <label className="mp-dashboard-filter-label">年度</label>
            <select
              value={filters.academicYear ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, academicYear: e.target.value ? Number(e.target.value) : undefined })
              }
              className="mp-dashboard-filter-input"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {formatAcademicYear(year)}
                </option>
              ))}
            </select>
          </div>

          <div className="mp-dashboard-filter-field">
            <label className="mp-dashboard-filter-label">部活動名</label>
            <select
              value={filters.clubName ?? "全活動"}
              onChange={(e) => setFilters({ ...filters, clubName: e.target.value })}
              className="mp-dashboard-filter-input"
            >
              <option value="全活動">全活動</option>
              {clubOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="mp-dashboard-filter-field">
            <label className="mp-dashboard-filter-label">開始日</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mp-dashboard-filter-input"
            />
          </div>

          <div className="mp-dashboard-filter-field">
            <label className="mp-dashboard-filter-label">終了日</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mp-dashboard-filter-input"
            />
          </div>
        </div>
      </aside>

      {/* 結果一覧 */}
      <main className="mp-dashboard-main">
        <div className="mp-dashboard-header-actions">
          <h2 className="mp-dashboard-results-title">結果一覧 ({results.length}件)</h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={results.length === 0}
            className="mp-dashboard-export-btn"
          >
            Excelダウンロード
          </button>
        </div>

        {isLoading && <div className="mp-dashboard-loading">読み込み中...</div>}
        {error && <div className="mp-dashboard-error" role="alert">{error}</div>}

        {!isLoading && !error && results.length === 0 && (
          <div className="mp-dashboard-empty">該当するデータがありません。</div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="mp-dashboard-table-wrap">
            <table className="mp-dashboard-table">
              <thead>
                <tr>
                  <th>大会日</th>
                  <th>部活動名</th>
                  <th>大会名</th>
                  <th>種別</th>
                  <th>成績</th>
                  <th>メンバー</th>
                  <th>特別賞</th>
                  <th aria-label="操作"> </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{displayDate(result)}</td>
                    <td>{result.club_name}</td>
                    <td>{result.competition_name || "—"}</td>
                    <td>{result.division === "team" ? "団体" : "個人"}</td>
                    <td>{formatScore(result.payload)}</td>
                    <td>{formatMembers(result.payload)}</td>
                    <td>{result.special_prizes || "—"}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setEditingResult(result)}
                        className="mp-dashboard-edit-btn"
                        title="編集"
                        aria-label="編集"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingResult && (
          <MpEditResultModal
            result={editingResult}
            onClose={() => setEditingResult(null)}
            onSaved={() => {
              setEditingResult(null);
              loadResults();
            }}
          />
        )}
      </main>
    </div>
  );
}

interface MpEditResultModalProps {
  result: MpCompetitionResult;
  onClose: () => void;
  onSaved: () => void;
}

function MpEditResultModal({ result, onClose, onSaved }: MpEditResultModalProps) {
  const [competitionName, setCompetitionName] = useState(result.competition_name ?? "");
  const [date, setDate] = useState(toYMD(result.date ?? result.created_at));
  const [endDate, setEndDate] = useState(toYMD(result.end_date));
  const [specialPrizes, setSpecialPrizes] = useState(result.special_prizes ?? "");
  const [score, setScore] = useState("");
  const [rank, setRank] = useState("");
  const [studentName, setStudentName] = useState("");
  const [resultText, setResultText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isTeam = result.payload.type === "team";

  useEffect(() => {
    if (result.payload.type === "team") {
      setScore(result.payload.score ?? "");
      setRank(result.payload.rank ?? "");
    } else {
      const entry = result.payload.entries?.[0];
      setStudentName(entry?.student_name ?? "");
      setResultText(entry?.result ?? "");
    }
  }, [result.payload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    let newPayload: MpCompetitionPayload;
    if (result.payload.type === "team") {
      newPayload = {
        type: "team",
        members: result.payload.members ?? [],
        score: score.trim() || undefined,
        rank: rank.trim() || undefined,
        opponent: result.payload.opponent,
        round: result.payload.round,
      };
    } else {
      newPayload = {
        type: "individual",
        entries: [
          {
            student_name: studentName.trim() || (result.payload.entries?.[0]?.student_name ?? ""),
            result: resultText.trim() || undefined,
          },
        ],
      };
    }

    const res = await mpUpdateCompetitionResult(result.id, {
      competition_name: competitionName.trim() || null,
      date: date.trim() || null,
      end_date: endDate.trim() || null,
      special_prizes: specialPrizes.trim() || null,
      payload: newPayload,
    });

    setIsSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    onSaved();
  };

  return (
    <div className="mp-dashboard-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mp-edit-modal-title">
      <div className="mp-dashboard-modal">
        <h2 id="mp-edit-modal-title" className="mp-dashboard-modal-title">成績を編集</h2>
        <form onSubmit={handleSubmit} className="mp-dashboard-modal-form">
          {submitError && (
            <div className="mp-dashboard-modal-error" role="alert">
              {submitError}
            </div>
          )}

          <div className="mp-dashboard-modal-field">
            <label className="mp-dashboard-modal-label">大会名</label>
            <input
              type="text"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              className="mp-dashboard-modal-input"
            />
          </div>

          <div className="mp-dashboard-modal-row">
            <div className="mp-dashboard-modal-field">
              <label className="mp-dashboard-modal-label">大会日</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mp-dashboard-modal-input"
              />
            </div>
            <div className="mp-dashboard-modal-field">
              <label className="mp-dashboard-modal-label">終了日（任意）</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mp-dashboard-modal-input"
              />
            </div>
          </div>

          {isTeam ? (
            <>
              <div className="mp-dashboard-modal-field">
                <label className="mp-dashboard-modal-label">スコア</label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="mp-dashboard-modal-input"
                  placeholder="例: 3-1"
                />
              </div>
              <div className="mp-dashboard-modal-field">
                <label className="mp-dashboard-modal-label">順位・成績</label>
                <input
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="mp-dashboard-modal-input"
                  placeholder="例: 優勝、ベスト8"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mp-dashboard-modal-field">
                <label className="mp-dashboard-modal-label">生徒名</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mp-dashboard-modal-input"
                  placeholder="苗字 名前 (クラス)"
                />
              </div>
              <div className="mp-dashboard-modal-field">
                <label className="mp-dashboard-modal-label">成績</label>
                <input
                  type="text"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  className="mp-dashboard-modal-input"
                  placeholder="例: 優勝、ベスト8、2回戦敗退"
                />
              </div>
            </>
          )}

          <div className="mp-dashboard-modal-field">
            <label className="mp-dashboard-modal-label">特別賞・備考</label>
            <input
              type="text"
              value={specialPrizes}
              onChange={(e) => setSpecialPrizes(e.target.value)}
              className="mp-dashboard-modal-input"
            />
          </div>

          <div className="mp-dashboard-modal-actions">
            <button type="button" onClick={onClose} className="mp-dashboard-modal-cancel">
              キャンセル
            </button>
            <button type="submit" disabled={isSubmitting} className="mp-dashboard-modal-submit">
              {isSubmitting ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
