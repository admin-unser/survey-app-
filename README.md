# 現調報告 - 現場調査報告アプリ

エアコン工事業者向けの現場調査報告Webアプリケーション。案件管理、マップ/カレンダー表示、調査フォーム（写真添付対応）、PDF報告書自動発行を提供します。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage)
- **地図**: Google Maps JavaScript API (`@vis.gl/react-google-maps`)
- **カレンダー**: FullCalendar
- **PDF**: `@react-pdf/renderer`
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod

## セットアップ

### 1. 依存関係のインストール

```bash
cd survey-app
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. `supabase/schema.sql` の内容を Supabase の SQL Editor で実行
3. Storage バケット `survey-photos` と `reports` が作成されていることを確認
4. **「Could not find the 'client_contact_name' column」などのスキーマエラーが出る場合**: Supabase の SQL Editor で `supabase/migrations/20250304000000_add_missing_survey_cases_columns.sql` の内容を実行してください。

### 3. 環境変数の設定

`.env.local` を編集:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 機能一覧

| 機能 | 説明 |
|------|------|
| 認証 | メール/パスワード認証、管理者/現場作業員のロール管理 |
| ダッシュボード | 今日の予定、ステータスサマリー、最近の案件 |
| 案件管理 | 案件の作成/編集/一覧/詳細、検索/フィルタ/ソート |
| マップ表示 | Google Maps上に案件ピン表示、ステータス色分け、経路案内 |
| カレンダー | 月/週/日ビュー、D&Dスケジュール変更 |
| 調査フォーム | 9ステップのエアコン工事特化フォーム、自動保存 |
| 写真撮影 | カテゴリ別撮影、自動圧縮、キャプション |
| PDF報告書 | 自動生成、プレビュー、ダウンロード、共有 |

## ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [docs/DATA_STORAGE.md](docs/DATA_STORAGE.md) | **データの保存場所**（Supabase の Auth / DB / Storage の対応） |
| [docs/DEPLOY.md](docs/DEPLOY.md) | デプロイ方法・クライアントへの共有手順 |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | 使い方ガイド（クライアント・現場担当向け） |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | データベース・バックエンドの仕組みと構成 |

アプリ内の **「使い方ガイド」** メニューからも操作手順を確認できます。

## プロジェクト構成

```
src/
├── app/
│   ├── (auth)/           # 認証ページ
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/      # メインレイアウト
│   │   ├── dashboard/    # ダッシュボード
│   │   ├── cases/        # 案件管理
│   │   │   ├── [id]/
│   │   │   │   ├── edit/    # 案件編集
│   │   │   │   ├── survey/  # 調査フォーム
│   │   │   │   └── report/  # 報告書
│   │   │   └── new/     # 新規案件
│   │   ├── map/          # マップ表示
│   │   └── calendar/     # カレンダー表示
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── layout/           # サイドバー等
│   ├── cases/            # 案件フォーム
│   ├── survey/           # 調査フォーム・写真
│   └── report/           # PDF関連
├── lib/
│   ├── supabase/         # Supabase クライアント
│   ├── pdf/              # PDF テンプレート
│   └── utils.ts
├── hooks/                # カスタムフック
├── types/                # TypeScript型定義
└── stores/               # Zustand ストア
```
