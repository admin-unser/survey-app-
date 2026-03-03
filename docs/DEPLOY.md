# デプロイ・クライアント共有ガイド

現調報告アプリのデプロイ方法と、クライアント（利用者）への共有手順をまとめています。

---

## 1. デプロイの前提条件

- **Next.js 16** アプリ（App Router）
- **Supabase** プロジェクト（PostgreSQL・認証・Storage）
- **Vercel** 推奨（Next.js と相性が良い）

以下が済んでいること：

- Supabase でプロジェクト作成済み
- `supabase/schema.sql` を SQL Editor で実行済み
- Storage バケット `survey-photos`・`reports` が存在する

---

## 2. デプロイ方法（Vercel 推奨）

### 2.1 Vercel にデプロイする

1. **リポジトリを GitHub にプッシュ**
   - 本アプリのコードを GitHub リポジトリに push する。

2. **Vercel でプロジェクトをインポート**
   - [Vercel](https://vercel.com) にログイン
   - 「Add New」→「Project」で GitHub リポジトリを選択
   - **Root Directory** を `survey-app` に設定（リポジトリ直下に survey-app がある場合）
   - Framework Preset は **Next.js** のまま

3. **環境変数を設定**
   - プロジェクト設定の「Environment Variables」で以下を追加：

   | 名前 | 値 | 備考 |
   |------|-----|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase の Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名キー | Supabase → Settings → API |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API キー | マップ機能に必須 |

4. **デプロイ**
   - 「Deploy」でビルド・デプロイが実行される。
   - 成功すると `https://your-project.vercel.app` のような URL が発行される。

### 2.2 本番用 Supabase 設定（認証）

- Supabase Dashboard → **Authentication** → **URL Configuration**
  - **Site URL**: 本番のアプリ URL（例: `https://your-app.vercel.app`）
  - **Redirect URLs**: 上記に加え `https://your-app.vercel.app/**` を追加
- メール認証を使う場合、必要に応じて **Email Templates** や **SMTP** を設定。

---

## 3. その他のデプロイ先

- **Netlify**: Next.js 対応。ビルドコマンド `npm run build`、公開ディレクトリ `survey-app/.next` ではなく Netlify の Next.js ランタイムに任せる。
- **自前サーバー**: `npm run build` → `npm run start` で Node サーバーを起動。プロキシ（nginx 等）で HTTPS とドメインを設定。

いずれも上記 3 つの環境変数は必須です。

---

## 4. クライアントへの共有方法

### 4.1 共有するもの

- **アプリの URL**（例: `https://your-app.vercel.app`）
- **ログイン用メールアドレス・パスワード**（Supabase で作成したユーザー、または招待メールで発行したもの）
- **使い方ガイド**（アプリ内「使い方ガイド」または `docs/USER_GUIDE.md` を PDF/共有リンクで渡す）

### 4.2 ユーザー（クライアント）の用意

1. **Supabase でユーザー作成**
   - Supabase Dashboard → **Authentication** → **Users** → 「Add user」
   - メール・パスワードを設定
   - 必要なら「User Metadata」に `role: "field_worker"` または `role: "admin"` を設定（未設定時は `field_worker`）

2. **初回ログイン**
   - 共有した URL にアクセス → ログイン画面でメール・パスワードを入力
   - ログイン後、`profiles` にレコードが自動作成され、ロールに応じて使える機能が決まる

### 4.3 共有時の注意

- **管理者（admin）**: 全案件の作成・編集・削除、全報告書の閲覧が可能。人数を絞って共有することを推奨。
- **現場担当（field_worker）**: 自分にアサインされた案件のみ閲覧・編集可能。URL とアカウントを担当者ごとに共有する。

---

## 5. デプロイ後の確認リスト

- [ ] 本番 URL でログインできる
- [ ] ダッシュボード・案件一覧が表示される
- [ ] マップで案件ピンが表示される（Google Maps API キーが有効な場合）
- [ ] 調査フォームの保存・写真アップロードができる
- [ ] 報告書の PDF 生成・ダウンロードができる
- [ ] Supabase の Site URL / Redirect URLs に本番 URL を設定済み

---

## 6. トラブルシューティング

| 現象 | 確認すること |
|------|----------------|
| ログインできない | Site URL・Redirect URLs、メール/パスワードが正しいか |
| マップが表示されない | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` が設定され、Maps JavaScript API が有効か |
| 写真がアップロードできない | Storage バケットと RLS ポリシーが `schema.sql` 通りか |
| ビルドエラー | Node バージョン（推奨 20+）、`npm install` が通るか、型エラーがないか |

---

以上で、デプロイとクライアント共有の流れは一通り揃います。詳細な使い方は **使い方ガイド**、システム構成は **ARCHITECTURE.md** を参照してください。
