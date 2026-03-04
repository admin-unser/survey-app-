"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildCsv, downloadCsv, downloadXlsx, type CsvColumn } from "@/lib/export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { SurveyCase, CaseStatus } from "@/types/database";
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
} from "@/types/database";

const ITEMS_PER_PAGE = 20;
const SORT_OPTIONS = [
  { value: "scheduled_date-desc", label: "予定日（新しい順）" },
  { value: "scheduled_date-asc", label: "予定日（古い順）" },
  { value: "updated_at-desc", label: "更新日（新しい順）" },
  { value: "updated_at-asc", label: "更新日（古い順）" },
  { value: "case_number-asc", label: "案件番号（昇順）" },
  { value: "case_number-desc", label: "案件番号（降順）" },
] as const;

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<SurveyCase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at-desc");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // 初期状態をクエリパラメータから復元
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const status = searchParams.get("status") ?? "all";
    const sort = searchParams.get("sort") ?? "updated_at-desc";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const pageParam = Number(searchParams.get("page") ?? "1");

    setSearch(q);
    setDebouncedSearch(q);
    setStatusFilter(status);
    setSortBy(sort);
    setFromDate(from);
    setToDate(to);
    setPage(Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search),
      search ? 300 : 0
    );
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, fromDate, toDate]);

  // フィルター状態をURLに反映
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sortBy !== "updated_at-desc") params.set("sort", sortBy);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    router.replace(queryString ? `/cases?${queryString}` : "/cases");
  }, [debouncedSearch, statusFilter, sortBy, fromDate, toDate, page, router]);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const [sortField, sortOrder] = sortBy.split("-") as [string, "asc" | "desc"];
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("survey_cases")
      .select("*, assigned_profile:profiles!assigned_to(*)", {
        count: "exact",
      })
      .order(sortField, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (fromDate) {
      query = query.gte("scheduled_date", fromDate);
    }

    if (toDate) {
      query = query.lte("scheduled_date", toDate);
    }

    if (debouncedSearch.trim()) {
      const term = `%${debouncedSearch.trim()}%`;
      query = query.or(
        `case_number.ilike.${term},client_name.ilike.${term},address.ilike.${term}`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch cases:", error);
      setCases([]);
      setTotalCount(0);
    } else {
      setCases((data as SurveyCase[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setIsLoading(false);
  }, [page, statusFilter, sortBy, debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchCases();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [fetchCases]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);
    const supabase = createClient();

    const [sortField, sortOrder] = sortBy.split(
      "-"
    ) as [string, "asc" | "desc"];

    let query = supabase
      .from("survey_cases")
      .select("*, assigned_profile:profiles!assigned_to(*)")
      .order(sortField, { ascending: sortOrder === "asc" });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (fromDate) {
      query = query.gte("scheduled_date", fromDate);
    }

    if (toDate) {
      query = query.lte("scheduled_date", toDate);
    }

    if (debouncedSearch.trim()) {
      const term = `%${debouncedSearch.trim()}%`;
      query = query.or(
        `case_number.ilike.${term},client_name.ilike.${term},address.ilike.${term}`
      );
    }

    const { data, error } = await query;
    setIsExporting(false);
    if (error || !data) {
      console.error("Failed to export cases:", error);
      return;
    }

    const rows = data as SurveyCase[];
    const columns: CsvColumn<SurveyCase>[] = [
      { key: "case_number", header: "案件番号" },
      { key: "client_name", header: "顧客名" },
      { key: "address", header: "住所" },
      {
        key: "status",
        header: "ステータス",
        value: (row) => CASE_STATUS_LABELS[row.status],
      },
      {
        key: "scheduled_date",
        header: "予定日",
        value: (row) => row.scheduled_date ?? "",
      },
      {
        key: "scheduled_time_start",
        header: "開始時刻",
        value: (row) => row.scheduled_time_start?.slice(0, 5) ?? "",
      },
      {
        key: "scheduled_time_end",
        header: "終了時刻",
        value: (row) => row.scheduled_time_end?.slice(0, 5) ?? "",
      },
      {
        key: "created_at",
        header: "作成日時",
        value: (row) => row.created_at,
      },
      {
        key: "updated_at",
        header: "更新日時",
        value: (row) => row.updated_at,
      },
    ];

    if (format === "csv") {
      const csv = buildCsv(rows, columns);
      downloadCsv("cases.csv", csv);
    } else {
      downloadXlsx("cases.xlsx", rows, columns);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">案件一覧</h1>
          <p className="text-muted-foreground mt-1">
            調査案件の検索・管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExport("csv")}
          >
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExport("xlsx")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button asChild>
            <Link href="/cases/new">
              <Plus className="mr-2 h-4 w-4" />
              新規案件
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">検索・フィルター</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="案件番号・顧客名・住所で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {(Object.keys(CASE_STATUS_LABELS) as CaseStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {CASE_STATUS_LABELS[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                setSortBy(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">予定日（開始）</p>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">予定日（終了）</p>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {debouncedSearch || statusFilter !== "all"
                  ? "条件に一致する案件がありません"
                  : "案件がまだありません"}
              </p>
              {!debouncedSearch && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/cases/new">
                    <Plus className="mr-2 h-4 w-4" />
                    新規案件を作成
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {cases.map((c) => (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="block p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium text-muted-foreground">
                          {c.case_number}
                        </span>
                        <Badge
                          variant="secondary"
                          className={CASE_STATUS_COLORS[c.status]}
                        >
                          {CASE_STATUS_LABELS[c.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{c.client_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </span>
                        {c.scheduled_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {format(new Date(c.scheduled_date), "yyyy年M月d日(E)", {
                              locale: ja,
                            })}
                            {c.scheduled_time_start && (
                              <span className="text-xs">
                                {c.scheduled_time_start.slice(0, 5)}～
                                {c.scheduled_time_end?.slice(0, 5) ?? ""}
                              </span>
                            )}
                          </span>
                        )}
                        {c.assigned_profile && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            {c.assigned_profile.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm text-muted-foreground">
                      {c.assigned_profile?.full_name ?? "未割当"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {totalCount}件中 {(page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, totalCount)}件を表示
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                >
                  次へ
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
