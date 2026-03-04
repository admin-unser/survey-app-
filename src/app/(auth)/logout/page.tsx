"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const doSignOut = async () => {
      const supabase = createClient();
      try {
        // ローカルで即座にサインアウト（サーバー応答を待たない）
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // 失敗してもリダイレクトする
      } finally {
        router.replace("/login");
      }
    };
    doSignOut();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">ログアウトしています...</p>
    </div>
  );
}
