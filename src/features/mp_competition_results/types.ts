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
  created_at: string;
  updated_at: string;
}

export interface MpCompetitionResult {
  id: string;
  profile_id: string | null;
  club_name: string;
  competition_name: string | null;
  division: "team" | "individual";
  payload: MpCompetitionPayload;
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
    student_name: string; // 「三村(3-1)」形式
    score?: string;
    rank?: string;
    [key: string]: unknown;
  }>;
}
