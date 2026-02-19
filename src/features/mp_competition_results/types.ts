/**
 * Master-Portfolio-DB: 大会成績機能の型定義
 * mp_ プレフィックスで隔離
 */

export interface MpStudent {
  id: string;
  grade_class_num: string; // 「2-1-15」形式
  last_name: string;
  first_name: string;
  last_kana: string | null;
  first_kana: string | null;
  club_name: string;
  /** 兼部時の第2所属 */
  club_name_2: string | null;
  created_at: string;
  updated_at: string;
}

/** 生徒追加・編集フォーム用 */
export interface MpStudentFormData {
  grade_class_num: string;
  last_name: string;
  first_name: string;
  last_kana: string;
  first_kana: string;
  club_name: string;
  club_name_2: string; // 空文字で「なし」
}

/** データベースの大会成績テーブル構造 */
export interface MpCompetitionResult {
  id: string;
  profile_id: string | null;
  club_name: string;
  competition_name: string | null;
  division: "team" | "individual";
  payload: MpCompetitionPayload;
  special_prizes?: string;
  /** 大会日（開始日）YYYY-MM-DD */
  date?: string | null;
  /** 大会終了日（任意）YYYY-MM-DD */
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export type MpCompetitionPayload =
  | MpTeamPayload
  | MpIndividualPayload;

export interface MpTeamPayload {
  type: "team";
  members: string[]; // 「三村(3-1), 友野(3-2)」形式の文字列配列
  score?: string;
  rank?: string;
  opponent?: string;
  round?: string;
  [key: string]: unknown; // JSONBの柔軟性
}

export interface MpIndividualPayload {
  type: "individual";
  entries: Array<{
    student_name: string; // 「grade_class_num last_name first_name」形式
    result?: string; // 個人成績（例: 優勝, 2回戦敗退）
    score?: string;
    rank?: string;
    [key: string]: unknown;
  }>;
}

// ▼▼▼ ここが今回の修正ポイント（追記部分） ▼▼▼

/** 大会成績 入力フォーム用の型定義 */
// エラーの原因は、この型定義に date / endDate が無かったことでした
export interface MpResultFormData {
  competitionName: string;
  date: string;       // ← 必須
  endDate?: string;   // ← 任意
  division: "team" | "individual";
  
  // 団体戦用フィールド
  members: string[];
  score: string;
  rank: string;
  opponent: string;
  round: string;

  // 個人戦用フィールド
  individualEntries: { 
    student_name: string; 
    result: string 
  }[];

  specialPrizes: string;
}