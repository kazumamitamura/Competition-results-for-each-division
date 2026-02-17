-- =============================================================================
-- Master-Portfolio-DB: mp_students テーブル構造の更新（CSVインポート対応）
-- CSVの列構造に合わせてテーブルを再定義します。
-- Supabase SQL Editor で実行してください。
-- =============================================================================

-- 既存テーブルを削除（データがある場合は注意）
DROP TABLE IF EXISTS public.mp_students CASCADE;

-- CSV構造に合わせたテーブル定義
CREATE TABLE public.mp_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_class_num TEXT NOT NULL,  -- 「2-1-15」形式（学年-クラス-番号）
  last_name TEXT NOT NULL,         -- 姓
  first_name TEXT NOT NULL,         -- 名
  last_kana TEXT,                   -- 姓（かな）
  first_kana TEXT,                  -- 名（かな）
  club_name TEXT NOT NULL,          -- 担当部活名（RLSでフィルタリング）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定（自分の部活のデータのみ操作可能）
ALTER TABLE public.mp_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_students_select_own_club"
  ON public.mp_students FOR SELECT
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_students_insert_own_club"
  ON public.mp_students FOR INSERT
  WITH CHECK (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_students_update_own_club"
  ON public.mp_students FOR UPDATE
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_students_delete_own_club"
  ON public.mp_students FOR DELETE
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

-- updated_at 自動更新トリガー
CREATE TRIGGER mp_students_updated_at
  BEFORE UPDATE ON public.mp_students
  FOR EACH ROW EXECUTE FUNCTION public.mp_set_updated_at();

COMMENT ON TABLE public.mp_students IS 'Master-Portfolio-DB: 部員マスター（CSVインポート対応）。grade_class_num で学年・クラス・番号を管理。';
