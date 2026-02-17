-- Master-Portfolio-DB: 顧問の担当部活管理用カラム追加
-- 既に 001 で mp_user_profiles がある場合: このファイルのみ SQL Editor で実行
-- テーブルが未作成の場合: 001 実行後にこのファイルを実行

-- 担当部活名（卓球、バスケ等）を追加
ALTER TABLE public.mp_user_profiles
  ADD COLUMN IF NOT EXISTS assigned_club text;

COMMENT ON COLUMN public.mp_user_profiles.assigned_club IS '顧問が担当する部活名（teacher ロール用）';
