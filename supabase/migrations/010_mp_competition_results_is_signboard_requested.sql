-- Master-Portfolio-DB: 大会成績に看板依頼済みフラグを追加
ALTER TABLE public.mp_competition_results
  ADD COLUMN IF NOT EXISTS is_signboard_requested boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mp_competition_results.is_signboard_requested IS '看板製作依頼済みかどうか';
