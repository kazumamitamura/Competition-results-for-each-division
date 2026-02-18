"use client";

import { useState, useEffect } from "react";
import { mpGetCompetitionResults, type MpDashboardFilters } from "./actions/mpDashboardActions";
import { getAcademicYear, getAvailableAcademicYears, formatAcademicYear } from "./utils/academicYear";
import { exportToExcel } from "./utils/excelExport";
import type { MpCompetitionResult } from "./types";

interface MpDashboardClientProps {
  clubOptions: string[];
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

  useEffect(() => {
    async function loadResults() {
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
    }
    loadResults();
  }, [filters.academicYear, filters.clubName, dateFrom, dateTo]);

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
      return payload.entries?.[0]?.score || payload.entries?.[0]?.rank || "";
    }
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
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{formatDate(result.created_at)}</td>
                    <td>{result.club_name}</td>
                    <td>{result.competition_name || "—"}</td>
                    <td>{result.division === "team" ? "団体" : "個人"}</td>
                    <td>{formatScore(result.payload)}</td>
                    <td>{formatMembers(result.payload)}</td>
                    <td>{result.special_prizes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
