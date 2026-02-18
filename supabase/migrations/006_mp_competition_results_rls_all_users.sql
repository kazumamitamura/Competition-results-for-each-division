-- =============================================================================
-- Master-Portfolio-DB: mp_competition_results の RLS を全ログインユーザー閲覧可能に変更
-- ダッシュボードで全ユーザーが全データを閲覧・ダウンロードできるようにする
-- Supabase SQL Editor で実行してください。
-- =============================================================================

-- 既存の「自分の部活のみ」ポリシーを削除
DROP POLICY IF EXISTS "mp_competition_results_select_own_club" ON public.mp_competition_results;

-- 全ログインユーザーが全データを参照可能なポリシーに変更
CREATE POLICY "mp_competition_results_select_all_authenticated"
  ON public.mp_competition_results FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "mp_competition_results_select_all_authenticated" ON public.mp_competition_results IS 
  'Master-Portfolio-DB: ログイン済みユーザーは全大会成績を閲覧可能（ダッシュボード用）';
