"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
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
  MapPin,
  Search,
  ExternalLink,
  Phone,
  Calendar,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { SurveyCase, CaseStatus } from "@/types/database";
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from "@/types/database";

const STATUS_MARKER_COLORS: Record<CaseStatus, string> = {
  pending: "#6B7280",
  scheduled: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#10B981",
  reported: "#8B5CF6",
};

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // Tokyo

function MapMarkers({
  cases,
  selectedId,
  onSelect,
}: {
  cases: SurveyCase[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  const selectedCase = cases.find((c) => c.id === selectedId);

  useEffect(() => {
    if (!map || cases.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;
    cases.forEach((c) => {
      if (c.latitude && c.longitude) {
        bounds.extend({ lat: c.latitude, lng: c.longitude });
        hasBounds = true;
      }
    });
    if (hasBounds) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map, cases]);

  return (
    <>
      {cases.map(
        (c) =>
          c.latitude &&
          c.longitude && (
            <AdvancedMarker
              key={c.id}
              position={{ lat: c.latitude, lng: c.longitude }}
              onClick={() => onSelect(c.id)}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110"
                style={{
                  backgroundColor: STATUS_MARKER_COLORS[c.status],
                }}
              >
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </AdvancedMarker>
          )
      )}

      {selectedCase && selectedCase.latitude && selectedCase.longitude && (
        <InfoWindow
          position={{
            lat: selectedCase.latitude,
            lng: selectedCase.longitude,
          }}
          onCloseClick={() => onSelect(null)}
        >
          <div className="min-w-[240px] max-w-[300px] p-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-500">
                {selectedCase.case_number}
              </span>
              <Badge
                variant="secondary"
                className={CASE_STATUS_COLORS[selectedCase.status]}
              >
                {CASE_STATUS_LABELS[selectedCase.status]}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">
              {selectedCase.client_name}
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              {selectedCase.address}
            </p>
            {selectedCase.scheduled_date && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(selectedCase.scheduled_date), "M月d日(E)", {
                  locale: ja,
                })}
                {selectedCase.scheduled_time_start &&
                  ` ${selectedCase.scheduled_time_start.slice(0, 5)}`}
              </p>
            )}
            {selectedCase.client_phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <Phone className="h-3 w-3" />
                {selectedCase.client_phone}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                <Link href={`/cases/${selectedCase.id}`}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  詳細
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                asChild
              >
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCase.latitude},${selectedCase.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="mr-1 h-3 w-3" />
                  経路
                </a>
              </Button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function MapPage() {
  const [cases, setCases] = useState<SurveyCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<SurveyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("survey_cases")
        .select("*, assigned_profile:profiles!assigned_to(*)")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("scheduled_date", { ascending: true });

      if (data) {
        setCases(data as SurveyCase[]);
        setFilteredCases(data as SurveyCase[]);
      }
      setIsLoading(false);
    };
    fetchCases();
  }, []);

  const applyFilters = useCallback(() => {
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

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">マップ</h1>
        <div className="flex h-[600px] items-center justify-center rounded-lg border bg-secondary/40">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Google Maps API キーが設定されていません</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              .env.local に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マップ</h1>
        <div className="text-sm text-muted-foreground">
          {filteredCases.length}件表示中
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
            {(
              Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_MARKER_COLORS[value] }}
                  />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px] w-full rounded-lg" />
      ) : (
        <div className="h-[600px] overflow-hidden rounded-lg border">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={10}
              gestureHandling="greedy"
              mapId="survey-map"
              className="h-full w-full"
            >
              <MapMarkers
                cases={filteredCases}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Map>
          </APIProvider>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(
          ([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: STATUS_MARKER_COLORS[status] }}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
