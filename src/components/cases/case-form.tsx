"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { SurveyCase, CaseStatus, Profile } from "@/types/database";
import { CASE_STATUS_LABELS } from "@/types/database";

export const ASSIGNED_NONE = "__none__";

const caseFormSchema = z.object({
  client_name: z.string().min(1, "顧客名は必須です"),
  client_phone: z.string().optional(),
  client_contact_name: z.string().optional(),
  client_email: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "有効なメールアドレスを入力してください"
    ),
  address: z.string().min(1, "住所は必須です"),
  work_type: z.enum(
    ["survey", "maintenance", "construction", "meeting"] as const
  ),
  scheduled_date: z.string().optional(),
  scheduled_time_start: z.string().optional(),
  scheduled_time_end: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum([
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "reported",
  ] as const),
  notes: z.string().optional(),
});

export type CaseFormData = z.infer<typeof caseFormSchema>;

interface CaseFormProps {
  initialData?: SurveyCase;
  onSubmit: (data: CaseFormData) => Promise<void>;
}

export function CaseForm({ initialData, onSubmit }: CaseFormProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      client_name: initialData?.client_name ?? "",
      client_contact_name: initialData?.client_contact_name ?? "",
      client_phone: initialData?.client_phone ?? "",
      client_email: initialData?.client_email ?? "",
      address: initialData?.address ?? "",
      work_type: (initialData?.work_type as CaseFormData["work_type"]) ?? "survey",
      scheduled_date: initialData?.scheduled_date ?? "",
      scheduled_time_start: initialData?.scheduled_time_start?.slice(0, 5) ?? "",
      scheduled_time_end: initialData?.scheduled_time_end?.slice(0, 5) ?? "",
      assigned_to: initialData?.assigned_to ?? ASSIGNED_NONE,
      status: initialData?.status ?? "pending",
      notes: initialData?.notes ?? "",
    },
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (!error && data) {
        setProfiles(data as Profile[]);
      }
    };
    fetchProfiles();
  }, []);

  const handleSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : String(e ?? "不明なエラー");
      toast.error("保存に失敗しました", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>顧客と案件の基本情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>顧客名（必須）</FormLabel>
                  <FormControl>
                    <Input placeholder="山田 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>顧客担当者名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 管理会社 担当 佐藤様" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話番号</FormLabel>
                    <FormControl>
                      <Input placeholder="090-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>住所（必須）</FormLabel>
                  <FormControl>
                    <Input placeholder="東京都渋谷区..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予定・担当・作業内容</CardTitle>
            <CardDescription>
              調査予定日時と担当者・作業内容を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予定日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_time_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始時刻</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduled_time_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了時刻</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="work_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作業内容</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="作業内容を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="survey">現場調査</SelectItem>
                        <SelectItem value="maintenance">
                          メンテナンス
                        </SelectItem>
                        <SelectItem value="construction">施工</SelectItem>
                        <SelectItem value="meeting">
                          現場対応（打ち合わせ）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ASSIGNED_NONE}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="担当者を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ASSIGNED_NONE}>未割当</SelectItem>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v as CaseStatus)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map(
                          (s) => (
                            <SelectItem key={s} value={s}>
                              {CASE_STATUS_LABELS[s]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
            <CardDescription>その他のメモや注意事項</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="特記事項があれば入力してください"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
