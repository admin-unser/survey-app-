"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  Download,
  FileText,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type {
  SurveyCase,
  SurveyForm,
  SurveyPhoto,
  Report,
} from "@/types/database";

const PdfActions = dynamic(
  () =>
    import("@/components/report/pdf-actions").then((mod) => ({
      default: mod.PdfActions,
    })),
  { ssr: false, loading: () => <Skeleton className="h-10 w-full" /> }
);

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const { profile } = useAuth();

  const [surveyCase, setSurveyCase] = useState<SurveyCase | null>(null);
  const [surveyForm, setSurveyForm] = useState<SurveyForm | null>(null);
  const [photos, setPhotos] = useState<SurveyPhoto[]>([]);
  const [existingReports, setExistingReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const [caseRes, formRes, reportsRes] = await Promise.all([
        supabase.from("survey_cases").select("*").eq("id", caseId).single(),
        supabase
          .from("survey_forms")
          .select("*")
          .eq("case_id", caseId)
          .single(),
        supabase
          .from("reports")
          .select("*")
          .eq("case_id", caseId)
          .order("generated_at", { ascending: false }),
      ]);

      if (caseRes.data) setSurveyCase(caseRes.data as SurveyCase);
      if (formRes.data) {
        setSurveyForm(formRes.data as SurveyForm);

        const { data: photosData } = await supabase
          .from("survey_photos")
          .select("*")
          .eq("form_id", formRes.data.id)
          .order("sort_order");

        if (photosData) {
          const photosWithUrls = photosData.map((p: { storage_path: string; [key: string]: unknown }) => ({
            ...p,
            public_url: supabase.storage
              .from("survey-photos")
              .getPublicUrl(p.storage_path).data.publicUrl,
          })) as SurveyPhoto[];
          setPhotos(photosWithUrls);
        }
      }
      if (reportsRes.data) setExistingReports(reportsRes.data as Report[]);

      setIsLoading(false);
    };
    fetchData();
  }, [caseId]);

  const handleSaveReport = useCallback(
    async (blob: Blob) => {
      if (!surveyCase) return;
      if (!profile?.id) {
        toast.error("ログインが必要です");
        return;
      }
      setIsGenerating(true);

      const supabase = createClient();

      const fileName = `${surveyCase.case_number}/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, blob, { contentType: "application/pdf" });

      if (uploadError) {
        toast.error("PDFのアップロードに失敗しました");
        setIsGenerating(false);
        return;
      }

      const version = existingReports.length + 1;

      const [insertResult, updateResult] = await Promise.all([
        supabase
          .from("reports")
          .insert({
            case_id: caseId,
            pdf_storage_path: fileName,
            version,
            generated_by: profile.id,
          })
          .select()
          .single(),
        supabase
          .from("survey_cases")
          .update({ status: "reported" })
          .eq("id", caseId),
      ]);

      const { data: report, error: dbError } = insertResult;

      if (dbError) {
        toast.error("報告書の記録に失敗しました");
        setIsGenerating(false);
        return;
      }

      if (updateResult.error) {
        toast.error("案件ステータスの更新に失敗しました", {
          description: updateResult.error.message,
        });
      }

      setExistingReports((prev) => [report as Report, ...prev]);
      setIsGenerating(false);
      router.refresh();
      toast.success("報告書を発行しました", {
        description: `Version ${version}`,
      });
    },
    [surveyCase, caseId, existingReports.length, profile?.id, router]
  );

  const getReportUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("reports").getPublicUrl(path).data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!surveyCase || !surveyForm) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">報告書</h1>
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">
                調査フォームが未入力です。先に調査フォームを完了してください。
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/cases/${caseId}/survey`}>調査フォームへ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generatedDate = format(new Date(), "yyyy年M月d日", { locale: ja });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cases/${caseId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">作業報告書</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cases/${caseId}/report/edit`}>編集</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {surveyCase.case_number} - {surveyCase.client_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            報告書を発行
          </CardTitle>
          <CardDescription>
            調査データからPDF報告書を自動生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-secondary/60 p-4">
            <h3 className="text-sm font-medium mb-2">含まれるデータ</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- 顧客情報、住所</li>
              <li>- 部屋情報、既存エアコン情報</li>
              <li>- 電気系統、配管・ドレン情報</li>
              <li>- 室外機、壁面・スリーブ情報</li>
              <li>- 追加工事項目</li>
              <li>- 調査コメント</li>
              <li>- 調査写真 ({photos.length}枚)</li>
            </ul>
          </div>

          <PdfActions
            surveyCase={surveyCase}
            surveyForm={surveyForm}
            photos={photos}
            generatedDate={generatedDate}
            onSaveBlob={handleSaveReport}
            isGenerating={isGenerating}
          />
        </CardContent>
      </Card>

      {existingReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">発行済み報告書</CardTitle>
            <CardDescription>過去に発行された報告書の一覧</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">
                        報告書 v{report.version}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(report.generated_at),
                          "yyyy/MM/dd HH:mm",
                          { locale: ja }
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      PDF
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={getReportUrl(report.pdf_storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          getReportUrl(report.pdf_storage_path)
                        );
                        toast.success("URLをコピーしました");
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
