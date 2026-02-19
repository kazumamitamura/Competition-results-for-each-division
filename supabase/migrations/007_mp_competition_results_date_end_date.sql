-- Master-Portfolio-DB: 大会成績に大会日・終了日を追加
ALTER TABLE public.mp_competition_results
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

COMMENT ON COLUMN public.mp_competition_results.date IS '大会開始日';
COMMENT ON COLUMN public.mp_competition_results.end_date IS '大会終了日（任意）';
