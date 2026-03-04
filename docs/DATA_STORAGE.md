# データの保存場所

本アプリのデータは **Supabase** 上に保存されています。Supabase は「認証」「データベース」「ファイル保存」をひとまとめに提供するサービスです。

## どこに何が保存されているか

### 1. 認証（Supabase Auth）

- **保存場所**: Supabase の **Authentication** 機能
- **内容**: ログインしているユーザー（メール・パスワード等）。サインアップ時に自動作成されます。
- **確認方法**: Supabase ダッシュボード → **Authentication** → **Users**

### 2. データベース（PostgreSQL）

- **保存場所**: Supabase の **PostgreSQL**（Table Editor で見えるテーブル）
- **主なテーブル**:

| テーブル名 | 内容 |
|-----------|------|
| `profiles` | ユーザー名・ロール（管理者/現場）・連絡先など。Auth のユーザーと 1:1 対応 |
| `survey_cases` | 案件（案件番号・顧客名・住所・緯度経度・予定日時・担当者・ステータスなど） |
| `survey_forms` | 調査フォームの入力内容（案件ごと 1 件） |
| `survey_photos` | 調査写真のメタデータ（ファイル本体は Storage に保存） |
| `reports` | 報告書のメタデータ（発行日・バージョン・PDF の Storage パスなど） |

- **確認方法**: Supabase ダッシュボード → **Table Editor** → 上記テーブルを選択

### 3. ファイル（Supabase Storage）

- **保存場所**: Supabase の **Storage**（バケット単位で管理）
- **バケット一覧**:

| バケット名 | 用途 |
|------------|------|
| `survey-photos` | 現場で撮影した調査写真（画像ファイル） |
| `reports` | 発行した PDF 報告書 |

- **確認方法**: Supabase ダッシュボード → **Storage** → 各バケットを開く

## まとめ

- **ユーザー情報** → Supabase **Auth** + DB の **profiles**
- **案件・フォーム・報告書のメタデータ** → DB の **survey_cases / survey_forms / reports / survey_photos**
- **写真・PDF ファイル** → **Storage** の `survey-photos` と `reports`

実際のデータの確認・バックアップ・エクスポートは、Supabase のダッシュボード（[supabase.com](https://supabase.com) にログイン後、該当プロジェクトを開く）から行えます。
