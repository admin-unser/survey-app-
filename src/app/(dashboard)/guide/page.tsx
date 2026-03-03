"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const sections = [
  {
    title: "1. ログイン",
    content: "共有されたアプリのURLを開き、メールアドレスとパスワードを入力して「ログイン」をクリックします。パスワードを忘れた場合は管理者に再発行を依頼してください。",
  },
  {
    title: "2. 画面の見方（メニュー）",
    content: "左（パソコン）または下（スマホ）のメニューから各画面に移動できます。ダッシュボードで今日の予定とサマリー、案件管理で一覧・検索・新規作成、報告書一覧でPDFのダウンロード、マップで場所確認・経路案内、カレンダーで予定の確認・日時変更ができます。管理者は全案件、現場担当は自分に割り当てられた案件のみ表示されます。",
  },
  {
    title: "3. ダッシュボード",
    content: "今日の予定・ステータス別の件数（クリックで絞り込み）・最近の案件が表示されます。管理者は「新規案件」で案件を作成できます。",
  },
  {
    title: "4. 案件管理",
    content: "検索・ステータス・日付範囲・並び替えで一覧を絞り込みできます。案件をクリックすると詳細へ。管理者は「新規案件」でお客様名・住所・予定日・担当者などを入力して保存。案件詳細から「編集」で内容変更、「調査フォームへ」で現場調査の入力、「報告書」でPDFの生成・ダウンロードができます。",
  },
  {
    title: "5. 調査フォーム（現場調査の入力）",
    content: "9ステップ（室内情報・既設エアコン・電気・配管・ドレン・室外機・壁・追加工事・コメント）で入力します。自動保存されるので途中で離れても再開できます。カテゴリを選んで写真を撮影・アップロードし、最後に「提出」で確定すると報告書を発行できるようになります。",
  },
  {
    title: "6. 報告書",
    content: "案件詳細の「報告書」で、調査フォーム提出後に「報告書を生成」するとPDFが作成されます。プレビューで確認し「ダウンロード」で保存。報告書一覧からも発行済みのPDFをダウンロードできます。",
  },
  {
    title: "7. マップ",
    content: "案件の住所がピンで表示され、色はステータスで変わります。ピンクリックで案件情報を表示し「経路」でGoogleマップの経路案内を開けます。",
  },
  {
    title: "8. カレンダー",
    content: "月・週・日表示で予定を確認できます。ドラッグで予定の日時を変更できる場合があります。",
  },
  {
    title: "9. 権限の違い",
    content: "管理者：全案件の閲覧・編集・削除、新規案件作成が可能。現場担当：自分が担当の案件のみ閲覧・編集・調査フォーム入力・報告書の生成・ダウンロードが可能。",
  },
  {
    title: "10. よくある質問",
    items: [
      "ログインできない → メール・パスワードを確認し、管理者に連絡。",
      "案件が表示されない → 現場担当は担当割り当てされた案件のみ表示。担当は管理者が案件編集で設定。",
      "写真がアップロードできない → ファイルサイズを小さくして再試行。",
      "報告書を生成できない → その案件の調査フォームが「提出」済みか確認。",
      "マップが表示されない → ブラウザの設定・ネットワークを確認し、管理者に地図設定を依頼。",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          使い方ガイド
        </h1>
        <p className="text-muted-foreground mt-1">
          現調報告アプリの操作手順です。不明な点は管理者までお問い合わせください。
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {"items" in section && section.items ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {section.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {section.content}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
