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
      await supabase.auth.signOut();
      router.replace("/login");
    };
    doSignOut();
  }, [router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">ログアウトしています...</p>
    </div>
  );
}
