"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ marginBottom: "1rem" }}>エラーが発生しました</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          {error.message.includes("環境変数")
            ? error.message
            : "予期しないエラーです。再読み込みをお試しください。"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          再読み込み
        </button>
      </body>
    </html>
  );
}
