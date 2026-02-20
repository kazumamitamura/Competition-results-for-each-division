-- Master-Portfolio-DB: 通知テーブル（看板製作依頼等）
CREATE TABLE IF NOT EXISTS public.mp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mp_notifications ENABLE ROW LEVEL SECURITY;

-- 自分の通知のみ参照・更新可能
CREATE POLICY "mp_notifications_select_own"
  ON public.mp_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "mp_notifications_update_own"
  ON public.mp_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 認証済みユーザーは通知を挿入可能（看板依頼で他ユーザー向けに挿入するため）
CREATE POLICY "mp_notifications_insert_authenticated"
  ON public.mp_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.mp_notifications IS 'Master-Portfolio-DB: 通知（看板製作依頼等）。user_id は通知の宛先。';
