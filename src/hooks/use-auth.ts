"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/types/database";

export function useAuth() {
  const router = useRouter();
  const { profile, isLoading, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          setProfile(error ? null : (data as Profile | null));
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: { user: { id: string } } | null) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        // /logout や /login にいる場合は二重ナビゲーションを防ぐ
        const pathname = window.location.pathname;
        if (pathname !== "/login" && pathname !== "/logout") {
          router.replace("/login");
        }
      } else if (session?.user) {
        // NOTE: onAuthStateChange コールバック内で直接 supabase クエリを await すると
        // _notifyAllSubscribers が await するため initializePromise と循環デッドロックになる。
        // setTimeout で次のイベントループに遅延させ initializePromise 解決後に実行する。
        const userId = session.user.id;
        setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            setProfile(error ? null : (data as Profile | null));
          } catch {
            setProfile(null);
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut({ scope: "local" });
      // SIGNED_OUT イベントが onAuthStateChange でナビゲーションを処理する
    } catch {
      // 例外時は手動でナビゲート
      router.replace("/login");
    }
  }, [router]);

  return { profile, isLoading, signOut, isAdmin: profile?.role === "admin" };
}
