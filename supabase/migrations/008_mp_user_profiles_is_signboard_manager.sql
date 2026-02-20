-- Master-Portfolio-DB: 看板製作担当フラグを mp_user_profiles に追加
ALTER TABLE public.mp_user_profiles
  ADD COLUMN IF NOT EXISTS is_signboard_manager boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mp_user_profiles.is_signboard_manager IS '看板製作担当かどうか';
