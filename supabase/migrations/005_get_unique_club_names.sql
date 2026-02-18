-- RPC: mp_students に存在する部活名の一覧を返す（部活選択プルダウン用）
-- 認証済みユーザーが担当部活を選ぶために使用。SECURITY DEFINER で全件取得可能にする。

CREATE OR REPLACE FUNCTION public.get_unique_club_names()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT club_name
  FROM public.mp_students
  WHERE club_name IS NOT NULL AND club_name != ''
  ORDER BY club_name;
$$;

COMMENT ON FUNCTION public.get_unique_club_names() IS 'Master-Portfolio-DB: 部活選択用に mp_students の部活名一覧を返す';
