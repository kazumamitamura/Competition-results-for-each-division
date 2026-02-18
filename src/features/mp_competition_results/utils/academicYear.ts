/**
 * 日本の学校年度（4月始まり）を計算するユーティリティ
 */

/**
 * 指定日付から学校年度を取得（例: 2025年1月 → 2024年度）
 */
export function getAcademicYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-11 → 1-12
  return month >= 4 ? year : year - 1;
}

/**
 * 学校年度の開始日（4月1日）を取得
 */
export function getAcademicYearStart(year: number): Date {
  return new Date(year, 3, 1); // month は 0-indexed なので 3 = 4月
}

/**
 * 学校年度の終了日（翌年3月31日）を取得
 */
export function getAcademicYearEnd(year: number): Date {
  return new Date(year + 1, 2, 31); // month 2 = 3月
}

/**
 * 利用可能な学校年度のリストを生成（現在年度から過去5年分）
 */
export function getAvailableAcademicYears(): number[] {
  const currentYear = getAcademicYear();
  const years: number[] = [];
  for (let i = 0; i < 6; i++) {
    years.push(currentYear - i);
  }
  return years;
}

/**
 * 学校年度を文字列に変換（例: 2024 → "2024年度"）
 */
export function formatAcademicYear(year: number): string {
  return `${year}年度`;
}
