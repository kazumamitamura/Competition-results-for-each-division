import * as XLSX from "xlsx";
import type { MpCompetitionResult } from "../types";

/**
 * 大会成績データをExcel形式でエクスポート
 */
export function exportToExcel(results: MpCompetitionResult[]) {
  if (results.length === 0) return;

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

  const rows = results.map((result) => ({
    日付: formatDate(result.created_at),
    部活: result.club_name,
    大会名: result.competition_name || "",
    種別: result.division === "team" ? "団体" : "個人",
    成績: formatScore(result.payload),
    メンバー: formatMembers(result.payload),
    特別賞: result.special_prizes || "",
    備考: "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "大会成績一覧");

  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const filename = `大会成績一覧_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
