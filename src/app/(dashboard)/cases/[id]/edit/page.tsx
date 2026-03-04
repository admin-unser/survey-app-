"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  CaseForm,
  type CaseFormData,
  ASSIGNED_NONE,
} from "@/components/cases/case-form";
import type { SurveyCase } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditCasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<SurveyCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCase = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("survey_cases")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("案件の取得に失敗しました", {
          description: error.message,
        });
        setCaseData(null);
      } else {
        setCaseData(data as SurveyCase);
      }
      setIsLoading(false);
    };

    if (id) fetchCase();
  }, [id]);

  const handleSubmit = async (data: CaseFormData) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("survey_cases")
      .update({
        client_name: data.client_name,
        client_contact_name: data.client_contact_name || null,
        client_phone: data.client_phone || null,
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
      })
      .eq("id", id);

    if (error) {
      const isSchemaError =
        /column.*survey_cases.*schema cache/i.test(error.message) ||
        /Could not find the/i.test(error.message);
      toast.error("更新に失敗しました", {
        description: isSchemaError
          ? "DBのスキーマが不足しています。Supabase の SQL Editor で supabase/migrations/ 内のマイグレーションを実行してください。"
          : error.message,
        duration: 8000,
      });
      return;
    }

    // 住所が変更された場合は再ジオコーディング（失敗しても続行）
    if (caseData?.address !== data.address) {
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
              .eq("id", id);
          }
        }
      } catch (e) {
        console.error("Failed to geocode edited case address:", e);
      }
    }

    toast.success("案件を更新しました");
    router.push(`/cases/${id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">案件編集</h1>
          <p className="text-muted-foreground mt-1 text-destructive">
            案件が見つかりません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cases/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            案件詳細に戻る
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">案件編集</h1>
        <p className="text-muted-foreground mt-1">
          {caseData.case_number} の情報を編集します
        </p>
      </div>
      <CaseForm initialData={caseData} onSubmit={handleSubmit} />
    </div>
  );
}
