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
    } = supabase.auth.onAuthStateChange(async (event: string, session: { user: { id: string } } | null) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        router.push("/login");
      } else if (session?.user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          setProfile(error ? null : (data as Profile | null));
        } catch {
          setProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  return { profile, isLoading, signOut, isAdmin: profile?.role === "admin" };
}
