"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  FolderOpen,
  Download,
  ExternalLink,
  Search,
  ChevronRight,
  ChevronDown,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buildCsv, downloadCsv, downloadXlsx, type CsvColumn } from "@/lib/export";
import type { Report, SurveyCase } from "@/types/database";
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from "@/types/database";

interface ReportWithCase extends Report {
  survey_case: SurveyCase;
  generator_profile?: { full_name: string } | null;
}

interface CaseGroup {
  caseId: string;
  caseNumber: string;
  clientName: string;
  address: string;
  status: string;
  reports: ReportWithCase[];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportWithCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reports")
        .select(
          "*, survey_case:survey_cases!case_id(*, assigned_profile:profiles!assigned_to(*)), generator_profile:profiles!generated_by(full_name)"
        )
        .order("generated_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch reports:", error);
      } else if (data) {
        setReports(data as unknown as ReportWithCase[]);
      }
      setIsLoading(false);
    };
    fetchReports();
  }, []);

  const caseGroups = useMemo(() => {
    let filtered = reports;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.survey_case.client_name.toLowerCase().includes(q) ||
          r.survey_case.case_number.toLowerCase().includes(q) ||
          r.survey_case.address.toLowerCase().includes(q)
      );
    }

    const groupMap = new Map<string, CaseGroup>();
    for (const report of filtered) {
      const caseId = report.case_id;
      if (!groupMap.has(caseId)) {
        groupMap.set(caseId, {
          caseId,
          caseNumber: report.survey_case.case_number,
          clientName: report.survey_case.client_name,
          address: report.survey_case.address,
          status: report.survey_case.status,
          reports: [],
        });
      }
      groupMap.get(caseId)!.reports.push(report);
    }

    const groups = Array.from(groupMap.values());

    if (sortBy === "newest") {
      groups.sort((a, b) => {
        const aDate = a.reports[0]?.generated_at ?? "";
        const bDate = b.reports[0]?.generated_at ?? "";
        return bDate.localeCompare(aDate);
      });
    } else if (sortBy === "client") {
      groups.sort((a, b) => a.clientName.localeCompare(b.clientName));
    } else if (sortBy === "case_number") {
      groups.sort((a, b) => a.caseNumber.localeCompare(b.caseNumber));
    } else if (sortBy === "most_reports") {
      groups.sort((a, b) => b.reports.length - a.reports.length);
    }

    return groups;
  }, [reports, searchQuery, sortBy]);

  const toggleCase = (caseId: string) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCases(new Set(caseGroups.map((g) => g.caseId)));
  };

  const collapseAll = () => {
    setExpandedCases(new Set());
  };

  const getReportUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("reports").getPublicUrl(path).data.publicUrl;
  };

  const totalReports = reports.length;
  const totalCases = new Set(reports.map((r) => r.case_id)).size;

  const handleExport = async (format: "csv" | "xlsx") => {
    setIsExporting(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reports")
      .select(
        "*, survey_case:survey_cases!case_id(*, assigned_profile:profiles!assigned_to(*)), generator_profile:profiles!generated_by(full_name)"
      )
      .order("generated_at", { ascending: false });

    setIsExporting(false);
    if (error || !data) {
      console.error("Failed to export reports:", error);
      return;
    }

    const rows = data as unknown as ReportWithCase[];
    const columns: CsvColumn<ReportWithCase>[] = [
      {
        key: "case_number",
        header: "案件番号",
        value: (row) => row.survey_case.case_number,
      },
      {
        key: "client_name",
        header: "顧客名",
        value: (row) => row.survey_case.client_name,
      },
      {
        key: "address",
        header: "住所",
        value: (row) => row.survey_case.address,
      },
      {
        key: "status",
        header: "ステータス",
        value: (row) => CASE_STATUS_LABELS[row.survey_case.status],
      },
      { key: "version", header: "バージョン" },
      {
        key: "generated_at",
        header: "発行日時",
        value: (row) => row.generated_at,
      },
      {
        key: "generated_by",
        header: "発行者",
        value: (row) => row.generator_profile?.full_name ?? "",
      },
    ];

    if (format === "csv") {
      const csv = buildCsv(rows, columns);
      downloadCsv("reports.csv", csv);
    } else {
      downloadXlsx("reports.xlsx", rows, columns);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">報告書一覧</h1>
          <p className="text-sm text-muted-foreground mt-1">
            案件ごとにフォルダ管理されたPDF報告書を確認できます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            {totalCases} 案件
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {totalReports} 報告書
          </Badge>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExport("csv")}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExport("xlsx")}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="案件番号・顧客名・住所で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新の報告書順</SelectItem>
                <SelectItem value="client">顧客名順</SelectItem>
                <SelectItem value="case_number">案件番号順</SelectItem>
                <SelectItem value="most_reports">報告書数順</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                すべて開く
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                すべて閉じる
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : caseGroups.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">
                {searchQuery
                  ? "検索条件に一致する報告書がありません"
                  : "まだ報告書が発行されていません"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  案件の調査を完了し、報告書を発行するとここに表示されます
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {caseGroups.map((group) => {
            const isExpanded = expandedCases.has(group.caseId);

            return (
              <Card key={group.caseId} className="overflow-hidden">
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => toggleCase(group.caseId)}
                  className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 hover:bg-secondary/40 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">
                        {group.caseNumber}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          CASE_STATUS_COLORS[
                            group.status as keyof typeof CASE_STATUS_COLORS
                          ]
                        )}
                      >
                        {
                          CASE_STATUS_LABELS[
                            group.status as keyof typeof CASE_STATUS_LABELS
                          ]
                        }
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm truncate">
                      {group.clientName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {group.address}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    <FileText className="mr-1 h-3 w-3" />
                    {group.reports.length}件
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Report Files */}
                {isExpanded && (
                  <div className="border-t bg-secondary/20">
                    <div className="divide-y">
                      {group.reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-secondary/40 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              報告書 v{report.version}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(report.generated_at),
                                  "yyyy/M/d",
                                  { locale: ja }
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(
                                  new Date(report.generated_at),
                                  "HH:mm"
                                )}
                              </span>
                              {report.generator_profile && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {report.generator_profile.full_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={getReportUrl(report.pdf_storage_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="ブラウザで開く"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <a
                                href={getReportUrl(report.pdf_storage_path)}
                                download
                                title="ダウンロード"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs hidden sm:flex"
                              asChild
                            >
                              <Link href={`/cases/${report.case_id}`}>
                                案件を開く
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
