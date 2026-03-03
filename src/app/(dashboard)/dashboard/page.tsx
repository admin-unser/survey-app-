"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  ArrowRight,
  CalendarDays,
  MapPin,
  User,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { SurveyCase, CaseStatus } from "@/types/database";
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from "@/types/database";

interface StatusCount {
  pending: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  reported: number;
}

const STATUS_TOOLTIPS: Record<CaseStatus, string> = {
  pending: "未対応 - まだ担当者が割り当てられていない、または対応前の案件",
  scheduled: "予定済み - 調査日時が確定し、担当者がアサインされた案件",
  in_progress: "調査中 - 現場訪問中・現調入力中の案件",
  completed: "調査完了 - 現場調査が完了し、報告書発行待ちの案件",
  reported: "報告済み - 報告書を発行し、お客様に提出可能な案件",
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [todayCases, setTodayCases] = useState<SurveyCase[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount>({
    pending: 0,
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    reported: 0,
  });
  const [recentCases, setRecentCases] = useState<SurveyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const supabase = createClient();
        const today = format(new Date(), "yyyy-MM-dd");

        const [todayRes, allCasesRes, recentRes] = await Promise.all([
          supabase
            .from("survey_cases")
            .select("*, assigned_profile:profiles!assigned_to(*)")
            .eq("scheduled_date", today)
            .order("scheduled_time_start"),
          supabase.from("survey_cases").select("status"),
          supabase
            .from("survey_cases")
            .select("*, assigned_profile:profiles!assigned_to(*)")
            .order("updated_at", { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        if (todayRes.data) setTodayCases(todayRes.data as SurveyCase[]);
        if (todayRes.error) {
          console.error("Dashboard: today cases", todayRes.error);
        }
        if (recentRes.data) setRecentCases(recentRes.data as SurveyCase[]);
        if (recentRes.error) {
          console.error("Dashboard: recent cases", recentRes.error);
        }

        if (allCasesRes.data) {
          const counts: StatusCount = {
            pending: 0,
            scheduled: 0,
            in_progress: 0,
            completed: 0,
            reported: 0,
          };
          allCasesRes.data.forEach((c: { status: string }) => {
            const s = c.status as CaseStatus;
            if (s in counts) counts[s]++;
          });
          setStatusCounts(counts);
        }
        if (allCasesRes.error) {
          console.error("Dashboard: status counts", allCasesRes.error);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    {
      key: "pending" as CaseStatus,
      label: "未対応",
      value: statusCounts.pending,
      icon: ClipboardList,
      color: "text-muted-foreground",
      bg: "bg-muted",
      href: "/cases?status=pending",
    },
    {
      key: "scheduled" as CaseStatus,
      label: "予定済み",
      value: statusCounts.scheduled,
      icon: Clock,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
      href: "/cases?status=scheduled",
    },
    {
      key: "in_progress" as CaseStatus,
      label: "調査中",
      value: statusCounts.in_progress,
      icon: CalendarDays,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      href: "/cases?status=in_progress",
    },
    {
      key: "completed" as CaseStatus,
      label: "調査完了",
      value: statusCounts.completed,
      icon: CheckCircle2,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      href: "/cases?status=completed",
    },
    {
      key: "reported" as CaseStatus,
      label: "報告済み",
      value: statusCounts.reported,
      icon: FileText,
      color: "text-chart-5",
      bg: "bg-chart-5/10",
      href: "/cases?status=reported",
    },
  ];

  const totalCases = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            おかえりなさい
            {profile?.full_name ? `、${profile.full_name}さん` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), "yyyy年M月d日（EEEE）", { locale: ja })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs font-normal">
              {isAdmin ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  管理者ビュー - 全案件 {totalCases} 件
                </>
              ) : (
                <>
                  <User className="mr-1 h-3 w-3" />
                  現場ビュー - 今日の担当を確認
                </>
              )}
            </Badge>
          </div>
        </div>
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            新規案件
          </Link>
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Tooltip key={stat.label}>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <Link
                      href={stat.href}
                      className="flex items-center gap-3 rounded-lg transition-colors hover:bg-secondary/60"
                    >
                      <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px]">
              <p className="text-xs">{STATUS_TOOLTIPS[stat.key]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule - Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">本日の調査予定</CardTitle>
              <CardDescription>
                {todayCases.length > 0
                  ? `${todayCases.length}件の調査が予定されています`
                  : "本日の予定はありません"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                カレンダー
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : todayCases.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                本日の調査予定はありません
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-1">
                  {todayCases.map((c, idx) => (
                    <Link
                      key={c.id}
                      href={`/cases/${c.id}`}
                      className="group relative flex gap-4 rounded-lg p-2.5 transition-colors hover:bg-secondary/60"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-primary bg-background">
                          <div className="h-[6px] w-[6px] rounded-full bg-primary" />
                        </div>
                      </div>

                      {/* Time */}
                      <div className="w-12 shrink-0 pt-px">
                        {c.scheduled_time_start ? (
                          <span className="text-xs font-semibold text-primary">
                            {c.scheduled_time_start.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            未定
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {c.client_name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={CASE_STATUS_COLORS[c.status]}
                          >
                            {CASE_STATUS_LABELS[c.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                        {c.assigned_profile && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span>{c.assigned_profile.full_name}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">最近の案件</CardTitle>
              <CardDescription>直近の更新された案件</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cases">
                すべて見る
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                案件がまだありません
              </div>
            ) : (
              <div className="space-y-2">
                {recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary/60"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {c.case_number}
                        </span>
                        <Badge
                          variant="secondary"
                          className={CASE_STATUS_COLORS[c.status]}
                        >
                          {CASE_STATUS_LABELS[c.status]}
                        </Badge>
                      </div>
                      <span className="font-medium text-sm">
                        {c.client_name}
                      </span>
                      {c.assigned_profile && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {c.assigned_profile.full_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.updated_at), "M/d HH:mm")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
