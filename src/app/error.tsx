"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const isConfigError = error.message.includes("環境変数") || error.message.includes("Supabase");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-semibold">エラーが発生しました</h1>
        <p className="text-sm text-muted-foreground">
          {isConfigError
            ? error.message
            : "予期しないエラーです。しばらくしてから再読み込みしてください。"}
        </p>
        {!isConfigError && (
          <p className="text-xs text-muted-foreground">
            解決しない場合はブラウザのコンソール（F12）でエラー内容を確認してください。
          </p>
        )}
      </div>
      <Button onClick={reset} variant="default">
        再読み込み
      </Button>
    </div>
  );
}
