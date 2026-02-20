import type { MpCompetitionResult } from "../types";

const UTF8_BOM = "\uFEFF";

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(result: MpCompetitionResult): string {
  const dateStr = result.date || result.created_at;
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function getStudentNameOrClass(result: MpCompetitionResult): string {
  if (result.payload.type === "individual") {
    return result.payload.entries?.[0]?.student_name ?? "";
  }
  return (result.payload.members ?? []).join(", ");
}

function getResultOrScore(result: MpCompetitionResult): string {
  if (result.payload.type === "individual") {
    return result.payload.entries?.[0]?.result ?? result.payload.entries?.[0]?.score ?? result.payload.entries?.[0]?.rank ?? "";
  }
  const parts = [result.payload.rank, result.payload.round].filter(Boolean) as string[];
  return parts.join(" ");
}

/**
 * 表示中のデータを指導要録向けカラムで UTF-8 (BOM付き) CSV としてダウンロード
 */
export function exportToCsv(results: MpCompetitionResult[]): void {
  if (results.length === 0) return;

  const header = ["大会日", "生徒名/クラス", "大会名", "成績・結果", "備考・特別賞"];
  const rows = results.map((result) => [
    escapeCsvField(formatDate(result)),
    escapeCsvField(getStudentNameOrClass(result)),
    escapeCsvField(result.competition_name ?? ""),
    escapeCsvField(getResultOrScore(result)),
    escapeCsvField(result.special_prizes ?? ""),
  ]);

  const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([UTF8_BOM + csvContent], { type: "text/csv; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  a.download = `大会成績出力_${yyyymmdd}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
