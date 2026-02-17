-- Master-Portfolio-DB: mp_user_profiles テーブル
-- Supabase ダッシュボードの SQL Editor で実行してください。

-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS public.mp_user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS を有効化
ALTER TABLE public.mp_user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. ポリシー: 自分の行のみ参照・更新可能
CREATE POLICY "Users can read own profile"
  ON public.mp_user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.mp_user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.mp_user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. updated_at 自動更新（任意）
CREATE OR REPLACE FUNCTION public.mp_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mp_user_profiles_updated_at
  BEFORE UPDATE ON public.mp_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.mp_set_updated_at();

-- 5. コメント
COMMENT ON TABLE public.mp_user_profiles IS 'Master-Portfolio-DB: ユーザープロフィール（認証と紐付け）';
