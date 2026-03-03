# アーキテクチャ・データベース・裏側の仕組み

現調報告アプリの技術構成、データベース（Supabase）、デプロイまわりの「裏側」をまとめたドキュメントです。

---

## 1. 全体構成

```
[ クライアント（ブラウザ） ]
         │
         │ HTTPS
         ▼
[ Next.js 16 (Vercel 等) ]
  - App Router (React Server Components / Client Components)
  - 認証状態の維持（Cookie + Supabase SSR）
         │
         │ REST / Realtime
         ▼
[ Supabase ]
  - Auth (GoTrue) … ログイン・セッション
  - PostgreSQL … 案件・フォーム・報告書メタデータ
  - Storage … 調査写真・PDF 報告書
  - Row Level Security (RLS) … テーブル・Storage のアクセス制御
```

- **API サーバーを自前で持たない** 構成です。Next.js は静的・サーバー描画とルーティングを担当し、データの取得・保存は **Supabase のクライアント（anon key）** から直接行います。
- 認証は Supabase Auth の **メール/パスワード**。セッションは Cookie で保持し、`@supabase/ssr` の middleware と server/client 用クライアントで扱います。

---

## 2. 技術スタック（再掲）

| レイヤー | 技術 |
|----------|------|
| フロント | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui |
| 状態管理 | Zustand |
| フォーム | React Hook Form, Zod |
| バックエンド | Supabase (PostgreSQL, Auth, Storage) |
| 地図 | Google Maps JavaScript API (@vis.gl/react-google-maps) |
| カレンダー | FullCalendar |
| PDF | @react-pdf/renderer |
| デプロイ | Vercel 推奨（他は Netlify / 自前 Node サーバーも可） |

---

## 3. データベース（Supabase PostgreSQL）の仕組み

### 3.1 スキーマの役割

スキーマは `supabase/schema.sql` に定義されています。実行順序もこのファイルの並びで問題ありません。

#### 拡張・ENUM

- `uuid-ossp`: UUID 生成
- `user_role`: `'admin' | 'field_worker'`
- `case_status`: `'pending' | 'scheduled' | 'in_progress' | 'completed' | 'reported'`
- `photo_category`: 写真のカテゴリ（室内・既設エアコン・ブレーカー・室外・配管・壁・その他）

#### テーブル一覧と関係

```
auth.users (Supabase 管理)
    │
    └── profiles (id = auth.uid())
            │
            ├── survey_cases (created_by, assigned_to → profiles.id)
            │       │
            │       ├── survey_forms (case_id → survey_cases.id)  ※ 1 case : 1 form
            │       │       └── survey_photos (form_id → survey_forms.id)
            │       │
            │       └── reports (case_id → survey_cases.id, generated_by → profiles.id)
            │
            └── (Storage: survey-photos, reports)
```

- **profiles**: 認証ユーザーと 1:1。`auth.users` に INSERT されると `handle_new_user()` で自動作成。`role` で admin / field_worker を区別。
- **survey_cases**: 案件マスタ。案件番号は `generate_case_number()` で `INS-YYYY-NNNN` 形式で自動採番。
- **survey_forms**: 1 案件につき 1 フォーム。9 セクション分の JSONB とコメント。`submitted_at` で提出済みか判定。
- **survey_photos**: フォームに紐づく写真。`storage_path` は Storage のパス。`category` で種別管理。
- **reports**: 案件ごとの報告書 PDF メタデータ。実体は Storage の `reports` バケットに保存。

### 3.2 Row Level Security (RLS)

すべてのテーブルで RLS が有効です。ポリシーは「誰がどの行を読む/書くか」を制御します。

| テーブル | 管理者 (admin) | 現場担当 (field_worker) |
|----------|----------------|--------------------------|
| profiles | 全件参照可、自分は更新可、他ユーザーも更新可 | 全件参照可、自分だけ更新可 |
| survey_cases | 全件 参照/挿入/更新/削除 | 自分が assigned_to の案件のみ 参照/更新 |
| survey_forms | 全件 全操作 | 担当案件のフォームのみ 全操作 |
| survey_photos | 全件 全操作 | 担当案件に紐づく写真のみ 全操作 |
| reports | 全件 全操作 | 担当案件の報告書のみ 参照 |

- 現場担当は「自分に割り当てられた案件」だけ見えるようにするため、`survey_forms` / `survey_photos` / `reports` は `survey_cases.assigned_to = auth.uid()` で JOIN して判定しています。

### 3.3 トリガー

- **handle_new_user**: `auth.users` への INSERT 後、`profiles` に 1 行挿入。`raw_user_meta_data` から名前・ロールを取得。
- **generate_case_number**: `survey_cases` の INSERT 前に、年度ごとの連番で `case_number` を設定。
- **update_updated_at**: `profiles` / `survey_cases` / `survey_forms` の UPDATE 時に `updated_at` を `now()` に更新。

### 3.4 Storage

- **survey-photos**: 調査写真。アップロード・一覧・削除は認証ユーザー、参照も認証ユーザーに限定。
- **reports**: 報告書 PDF。認証ユーザーがアップロード・参照。

RLS は「bucket_id が survey-photos / reports であること」と、必要に応じて認証のみで制御しています。より厳しくする場合は、オブジェクトのパスに `case_id` や `user_id` を含め、ポリシーで `auth.uid()` や担当案件と紐付けることができます。

### 3.5 インデックス

- `survey_cases`: `status`, `assigned_to`, `scheduled_date`, `created_at DESC`
- `survey_photos`: `form_id`
- `reports`: `case_id`

一覧・絞り込み・JOIN 用に設定されています。

---

## 4. 認証の流れ（裏側）

1. ユーザーがログイン画面でメール・パスワードを送信。
2. フロントの `createClient()`（Supabase クライアント）が `signInWithPassword()` を呼ぶ。
3. Supabase Auth (GoTrue) が検証し、JWT を発行。セッションが Cookie に保存される（`@supabase/ssr` の middleware と server/client クライアントで設定）。
4. 以降、API リクエストにはこの Cookie（または Bearer トークン）が付き、Supabase が `auth.uid()` を解決して RLS でアクセス制御する。
5. アプリ側では `useAuth()` などで `profile` と `role` を取得し、管理者用 UI の表示・非表示や、案件の割り当て表示を行っている。

---

## 5. デプロイ環境での動き

- **Vercel**: リポジトリ連携で push のたびにビルド。`next build` が実行され、Server/Client がデプロイされる。環境変数は Vercel の「Environment Variables」で設定し、`NEXT_PUBLIC_*` はクライアントに埋め込まれる。
- **Supabase**: 開発用・本番用でプロジェクトを分ける場合、本番用の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を本番環境にだけ設定する。DB は `schema.sql` を本番プロジェクトの SQL Editor で実行して用意。
- **Google Maps**: 本番ドメインを API キーの制限に追加し、`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を本番環境に設定する。

---

## 6. データの流れ（代表例）

### 6.1 案件作成（管理者）

1. フロントで「新規案件」フォーム送信。
2. Supabase client の `from('survey_cases').insert({ ... })` で INSERT。
3. RLS で `profiles.role = 'admin'` のときのみ許可。
4. トリガーで `case_number` が付与され、`profiles.id` が `created_by` に入る。

### 6.2 調査フォームの保存・提出

1. フォーム入力は `survey_forms` の `room_info` などの JSONB を `upsert` で保存（case_id で 1 件に紐づく）。
2. 写真は Storage の `survey-photos` にアップロードし、`survey_photos` に行を INSERT（form_id, storage_path, category など）。
3. 「提出」時に `survey_forms` の `submitted_at` を `now()` に更新。案件の `status` を `completed` などに更新する処理があればそれも実行。

### 6.3 報告書 PDF

1. フロント（または Server Component）で `@react-pdf/renderer` により PDF を生成。
2. 生成した Blob を Supabase Storage の `reports` バケットにアップロード。
3. `reports` テーブルに `case_id`, `pdf_storage_path`, `generated_by`, `version` などを INSERT。
4. 一覧・ダウンロード時は `reports` を参照して `pdf_storage_path` から署名付き URL を取得して表示・ダウンロード。

---

## 7. まとめ

- **フロント**: Next.js 16 + React 19。認証状態と Supabase クライアントで DB/Storage に直接アクセス。
- **バックエンド**: 専用 API サーバーはなく、Supabase（PostgreSQL + Auth + Storage）がバックエンドの役割を担う。
- **データベース**: `schema.sql` のテーブル・RLS・トリガー・Storage ポリシーで、役割に応じたアクセス制御と自動採番・updated_at を実現。
- **デプロイ**: Vercel に Next.js をデプロイし、本番用 Supabase プロジェクトと環境変数を設定すれば、クライアントへ URL とアカウントを共有して利用開始できる状態になります。

詳細なデプロイ手順は **DEPLOY.md**、利用者向け操作は **USER_GUIDE.md** を参照してください。
