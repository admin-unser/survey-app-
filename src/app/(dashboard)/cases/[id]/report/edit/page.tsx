"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import type { SurveyCase, SurveyForm } from "@/types/database";

const reportFormSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(120, "タイトルが長すぎます"),
  summary: z
    .string()
    .max(400, "サマリーは400文字以内で入力してください")
    .optional(),
  body: z
    .string()
    .min(1, "報告本文を入力してください")
    .max(4000, "報告本文が長すぎます"),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

export default function ReportEditPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [surveyCase, setSurveyCase] = useState<SurveyCase | null>(null);
  const [surveyForm, setSurveyForm] = useState<SurveyForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: "",
      summary: "",
      body: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      const [caseRes, formRes] = await Promise.all([
        supabase.from("survey_cases").select("*").eq("id", caseId).single(),
        supabase
          .from("survey_forms")
          .select("*")
          .eq("case_id", caseId)
          .single(),
      ]);

      if (caseRes.data) setSurveyCase(caseRes.data as SurveyCase);
      if (formRes.data) setSurveyForm(formRes.data as SurveyForm);

      const caseData = caseRes.data as SurveyCase | null;
      const formData = formRes.data as SurveyForm | null;

      form.reset({
        title:
          caseData?.notes && caseData.notes.trim().length > 0
            ? caseData.notes
            : caseData
            ? `${caseData.client_name}様 現場調査報告書`
            : "",
        summary: caseData?.notes ?? "",
        body: formData?.comments ?? "",
      });

      setIsLoading(false);
    };

    fetchData();
  }, [caseId, form]);

  const handleSubmit = async (data: ReportFormData) => {
    if (!surveyForm || !surveyCase) return;

    const supabase = createClient();

    try {
      const [{ error: formError }, { error: caseError }] = await Promise.all([
        supabase
          .from("survey_forms")
          .update({
            comments: data.body,
          })
          .eq("id", surveyForm.id),
        supabase
          .from("survey_cases")
          .update({
            notes: data.summary ?? data.title,
          })
          .eq("id", surveyCase.id),
      ]);

      if (formError || caseError) {
        const message =
          formError?.message ??
          caseError?.message ??
          "保存中にエラーが発生しました";
        toast.error("作業報告書の保存に失敗しました", {
          description: message,
        });
        return;
      }

      toast.success("作業報告書を保存しました");
      router.refresh();
      router.push(`/cases/${caseId}/report`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : String(e ?? "不明なエラー");
      toast.error("作業報告書の保存に失敗しました", {
        description: message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!surveyCase || !surveyForm) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">作業報告書 編集</h1>
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              案件情報または調査フォームが見つかりませんでした。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cases/${caseId}/report`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">作業報告書 編集</h1>
          <p className="text-sm text-muted-foreground">
            {surveyCase.case_number} - {surveyCase.client_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            報告書本文
          </CardTitle>
          <CardDescription>
            顧客や元請けに提出する作業報告書のタイトル・サマリー・本文を編集します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>報告書タイトル</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例: ○○様邸 室内機交換工事 現場調査報告書"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>調査サマリー（任意）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="全体の所見や提案内容を2〜3行でまとめてください"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>現場所見・特記事項</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="現場状況、配管・電気・室外機周りの注意点、追加工事の要否などを詳しく記載してください。"
                        rows={10}
                        className="leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="order-2 sm:order-1"
                >
                  <Link href={`/cases/${caseId}/report`}>報告書プレビューへ</Link>
                </Button>
                <div className="flex gap-3 order-1 sm:order-2">
                  <Button type="submit">下書き保存</Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

