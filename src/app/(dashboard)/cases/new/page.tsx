"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  CaseForm,
  type CaseFormData,
  ASSIGNED_NONE,
} from "@/components/cases/case-form";

export default function NewCasePage() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleSubmit = async (data: CaseFormData) => {
    try {
      if (!profile?.id) {
        toast.error("認証エラー", {
          description: "ログインしてください",
        });
        return;
      }

      const supabase = createClient();
      const { data: newCase, error } = await supabase
        .from("survey_cases")
        .insert({
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          client_contact_name: data.client_contact_name || null,
          client_email: data.client_email || null,
          address: data.address,
          work_type: data.work_type,
          scheduled_date: data.scheduled_date || null,
          scheduled_time_start: data.scheduled_time_start
            ? `${data.scheduled_time_start}:00`
            : null,
          scheduled_time_end: data.scheduled_time_end
            ? `${data.scheduled_time_end}:00`
            : null,
          assigned_to:
            data.assigned_to && data.assigned_to !== ASSIGNED_NONE
              ? data.assigned_to
              : null,
          status: data.status,
          notes: data.notes || null,
          created_by: profile.id,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("作成に失敗しました", {
          description: error.message,
          duration: 5000,
        });
        return;
      }

      if (!newCase?.id) {
        toast.error("作成に失敗しました", {
          description: "レスポンスが不正です",
          duration: 5000,
        });
        return;
      }

      // 住所から緯度経度を取得して保存（失敗しても処理続行）
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: data.address }),
        });
        if (res.ok) {
          const { lat, lng } = (await res.json()) as {
            lat: number;
            lng: number;
          };
          if (typeof lat === "number" && typeof lng === "number") {
            await supabase
              .from("survey_cases")
              .update({ latitude: lat, longitude: lng })
              .eq("id", newCase.id);
          }
        }
      } catch (e) {
        console.error("Failed to geocode new case address:", e);
      }

      toast.success("案件を作成しました", { duration: 3000 });
      router.push(`/cases/${newCase.id}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : String(e ?? "不明なエラー");
      toast.error("保存中にエラーが発生しました", {
        description: message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">新規案件作成</h1>
        <p className="text-muted-foreground mt-1">
          新しい調査案件を作成します
        </p>
      </div>
      <CaseForm onSubmit={handleSubmit} />
    </div>
  );
}
