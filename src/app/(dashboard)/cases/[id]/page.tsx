"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  FileText,
  ClipboardList,
  Edit,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type {
  SurveyCase,
  SurveyForm,
  Report,
  CaseStatus,
} from "@/types/database";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
} from "@/types/database";

const STATUS_ORDER: CaseStatus[] = [
  "pending",
  "scheduled",
  "in_progress",
  "completed",
  "reported",
];

function getStatusIndex(status: CaseStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<SurveyCase | null>(null);
  const [surveyForm, setSurveyForm] = useState<SurveyForm | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const supabase = createClient();

      const [caseRes, formRes, reportRes] = await Promise.all([
        supabase
          .from("survey_cases")
          .select("*, assigned_profile:profiles!assigned_to(*)")
          .eq("id", id)
          .single(),
        supabase
          .from("survey_forms")
          .select("*")
          .eq("case_id", id)
          .maybeSingle(),
        supabase
          .from("reports")
          .select("*")
          .eq("case_id", id)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (caseRes.error) {
        setError(caseRes.error.message);
        setIsLoading(false);
        return;
      }

      setCaseData(caseRes.data as SurveyCase);
      setSurveyForm(formRes.data as SurveyForm | null);
      setReport(reportRes.data as Report | null);
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  const getReportDownloadUrl = (report: Report): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return "#";
    return `${supabaseUrl}/storage/v1/object/public/reports/${report.pdf_storage_path}`;
  };

  const getMapUrl = (): string => {
    if (!caseData) return "#";
    if (caseData.latitude != null && caseData.longitude != null) {
      return `https://www.google.com/maps?q=${caseData.latitude},${caseData.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(caseData.address)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            案件一覧に戻る
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error || "案件が見つかりませんでした"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusIndex = getStatusIndex(caseData.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cases">
              <ArrowLeft className="mr-2 h-4 w-4" />
              案件一覧
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {caseData.case_number}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={CASE_STATUS_COLORS[caseData.status]}
              >
                {CASE_STATUS_LABELS[caseData.status]}
              </Badge>
              <span className="text-muted-foreground">{caseData.client_name}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/cases/${id}/survey`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              調査フォーム
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/cases/${id}/report`}>
              <FileText className="mr-2 h-4 w-4" />
              報告書を発行
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/cases/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">お客様情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{caseData.client_name}</span>
            </div>
            {caseData.client_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${caseData.client_phone}`}
                  className="text-primary hover:underline"
                >
                  {caseData.client_phone}
                </a>
              </div>
            )}
            {caseData.client_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${caseData.client_email}`}
                  className="text-primary hover:underline"
                >
                  {caseData.client_email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">現場情報・スケジュール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm">{caseData.address}</p>
                <a
                  href={getMapUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
                >
                  地図で開く
                  <MapPin className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>
            {(caseData.scheduled_date || caseData.scheduled_time_start) && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {caseData.scheduled_date
                      ? format(new Date(caseData.scheduled_date), "yyyy年M月d日（EEEE）", {
                          locale: ja,
                        })
                      : "未設定"}
                  </span>
                </div>
                {(caseData.scheduled_time_start || caseData.scheduled_time_end) && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {caseData.scheduled_time_start?.slice(0, 5) ?? "—"}
                      {caseData.scheduled_time_end
                        ? ` 〜 ${caseData.scheduled_time_end.slice(0, 5)}`
                        : ""}
                    </span>
                  </div>
                )}
              </>
            )}
            {caseData.assigned_profile && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {caseData.assigned_profile.full_name}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Download */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">報告書</CardTitle>
            <CardDescription>
              {format(new Date(report.generated_at), "yyyy年M月d日 HH:mm", {
                locale: ja,
              })}
              に発行（v{report.version}）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a
                href={getReportDownloadUrl(report)}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="mr-2 h-4 w-4" />
                報告書をダウンロード
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">進捗状況</CardTitle>
          <CardDescription>案件の進行状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STATUS_ORDER.map((status, idx) => {
              const isCompleted = idx <= statusIndex;
              const isCurrent = idx === statusIndex;
              return (
                <div key={status} className="flex shrink-0 items-center">
                  <div
                    className={`flex flex-col items-center rounded-lg border px-4 py-2 min-w-[80px] ${
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : isCompleted
                          ? "border-chart-3/30 bg-chart-3/10"
                          : "border-muted bg-muted/30"
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {CASE_STATUS_LABELS[status]}
                    </span>
                    {isCompleted && (
                      <span className="mt-0.5 text-chart-3">✓</span>
                    )}
                  </div>
                  {idx < STATUS_ORDER.length - 1 && (
                    <div
                      className={`mx-1 h-0.5 w-4 shrink-0 ${
                        idx < statusIndex ? "bg-chart-3/50" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {caseData.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">備考</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {caseData.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
