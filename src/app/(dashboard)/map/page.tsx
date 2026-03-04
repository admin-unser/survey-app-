"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import type { SurveyCase, CaseStatus } from "@/types/database";
import { CASE_STATUS_LABELS } from "@/types/database";

const STATUS_COLORS: Record<CaseStatus, string> = {
  pending: "#6B7280",
  scheduled: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#10B981",
  reported: "#8B5CF6",
};

const MapClient = dynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export default function MapPage() {
  const [cases, setCases] = useState<SurveyCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<SurveyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("survey_cases")
      .select("*")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("scheduled_date", { ascending: true });

    if (data) {
      setCases(data as SurveyCase[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    let result = cases;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.client_name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q)
      );
    }
    setFilteredCases(result);
  }, [cases, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マップ</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredCases.length}件表示中
          </span>
          <Button variant="outline" size="sm" onClick={fetchCases} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="顧客名・住所で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[value] }}
                    />
                    {label}
                  </div>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="h-[600px] overflow-hidden rounded-lg border">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <MapClient cases={filteredCases} />
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(
          ([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
