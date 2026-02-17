-- =============================================================================
-- Master-Portfolio-DB: 大会成績用テーブル (Competition Results)
-- 実行前: mp_user_profiles が 001 / 002 で作成済みであること（assigned_club 含む）
-- Supabase SQL Editor で実行してください。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. mp_user_profiles について
--    テーブル・assigned_club は 001 / 002 で作成済みのため、ここでは作成しません。
--    未作成の場合は先に 001_mp_user_profiles.sql と 002_mp_user_profiles_assigned_club.sql を実行してください。
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 2. mp_students（部員・生徒マスター）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mp_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  club_name text NOT NULL,
  student_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_students ENABLE ROW LEVEL SECURITY;

-- 自分の担当部活（assigned_club）の部員のみ参照・編集可能
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

CREATE TRIGGER mp_students_updated_at
  BEFORE UPDATE ON public.mp_students
  FOR EACH ROW EXECUTE FUNCTION public.mp_set_updated_at();

COMMENT ON TABLE public.mp_students IS 'Master-Portfolio-DB: 部員（生徒）マスター。club_name で mp_user_profiles.assigned_club と紐付け。';

-- -----------------------------------------------------------------------------
-- 3. mp_competition_results（大会成績・JSONB で柔軟な形式）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mp_competition_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.mp_user_profiles(id) ON DELETE SET NULL,
  club_name text NOT NULL,
  competition_name text,
  division text NOT NULL CHECK (division IN ('team', 'individual')),
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_competition_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_competition_results_select_own_club"
  ON public.mp_competition_results FOR SELECT
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_competition_results_insert_own_club"
  ON public.mp_competition_results FOR INSERT
  WITH CHECK (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_competition_results_update_own_club"
  ON public.mp_competition_results FOR UPDATE
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "mp_competition_results_delete_own_club"
  ON public.mp_competition_results FOR DELETE
  USING (
    club_name = (SELECT assigned_club FROM public.mp_user_profiles WHERE id = auth.uid())
  );

CREATE TRIGGER mp_competition_results_updated_at
  BEFORE UPDATE ON public.mp_competition_results
  FOR EACH ROW EXECUTE FUNCTION public.mp_set_updated_at();

COMMENT ON TABLE public.mp_competition_results IS 'Master-Portfolio-DB: 大会成績。division=team|individual, payload にメンバー・結果等を JSONB で格納。';
