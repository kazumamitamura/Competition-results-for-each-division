# Master-Portfolio-DB

認証・部活動成績管理などの機能を `mp_` プレフィックスで統一した Next.js + Supabase プロジェクトです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase でテーブル作成

Supabase ダッシュボードの **SQL Editor** で、次のファイルの内容をそのまま実行してください。

- `supabase/migrations/001_mp_user_profiles.sql`

（`mp_user_profiles` テーブルと RLS ポリシーが作成されます。）

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、Supabase の URL と anon key を設定してください。

```bash
cp .env.example .env.local
```

### 4. 開発サーバー起動

```bash
npm run dev
```

- ログイン: http://localhost:3000/login  
- 新規登録: http://localhost:3000/signup  

未ログインで `/` にアクセスすると `/login` にリダイレクトされます。

## 認証機能 (mp_auth)

- **Supabase Auth** のメール・パスワード認証
- ログイン・新規登録画面
- 新規登録時に `mp_user_profiles` に氏名・初期権限（admin / teacher / student）を保存

実装はすべて `src/features/mp_auth/` および `app/(mp_auth)/` に配置しています。
