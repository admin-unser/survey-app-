"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, ExternalLink, Navigation } from "lucide-react";
import type { SurveyCase, CaseStatus } from "@/types/database";
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from "@/types/database";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS: Record<CaseStatus, string> = {
  pending: "#6B7280",
  scheduled: "#3B82F6",
  in_progress: "#F59E0B",
  completed: "#10B981",
  reported: "#8B5CF6",
};

function FitBounds({ cases }: { cases: SurveyCase[] }) {
  const map = useMap();
  useEffect(() => {
    const points = cases.filter((c) => c.latitude && c.longitude);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude!, points[0].longitude!], 14);
      return;
    }
    const lats = points.map((c) => c.latitude!);
    const lngs = points.map((c) => c.longitude!);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40] }
    );
  }, [map, cases]);
  return null;
}

export default function MapClient({ cases }: { cases: SurveyCase[] }) {
  return (
    <MapContainer
      center={[35.6812, 139.7671]}
      zoom={10}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds cases={cases} />
      {cases.map(
        (c) =>
          c.latitude &&
          c.longitude && (
            <CircleMarker
              key={c.id}
              center={[c.latitude, c.longitude]}
              radius={10}
              pathOptions={{
                color: "white",
                weight: 2,
                fillColor: STATUS_COLORS[c.status],
                fillOpacity: 1,
              }}
            >
              <Popup minWidth={240} maxWidth={300}>
                <div className="p-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">
                      {c.case_number}
                    </span>
                    <Badge
                      variant="secondary"
                      className={CASE_STATUS_COLORS[c.status]}
                    >
                      {CASE_STATUS_LABELS[c.status]}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm">{c.client_name}</p>
                  <p className="text-xs text-gray-600">{c.address}</p>
                  {c.scheduled_date && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(c.scheduled_date), "M月d日(E)", { locale: ja })}
                      {c.scheduled_time_start &&
                        ` ${c.scheduled_time_start.slice(0, 5)}`}
                    </p>
                  )}
                  {c.client_phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.client_phone}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                      <Link href={`/cases/${c.id}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        詳細
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="mr-1 h-3 w-3" />
                        経路
                      </a>
                    </Button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
      )}
    </MapContainer>
  );
}
