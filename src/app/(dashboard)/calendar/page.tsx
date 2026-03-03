"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, EventDropArg } from "@fullcalendar/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { SurveyCase, CaseStatus, Profile } from "@/types/database";
import { CASE_STATUS_LABELS } from "@/types/database";

const STATUS_CALENDAR_COLORS: Record<CaseStatus, string> = {
  pending: "#6B7280",
  scheduled: "#3B82F6",
  in_progress: "#EAB308",
  completed: "#22C55E",
  reported: "#A855F7",
};

export default function CalendarPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allCases, setAllCases] = useState<SurveyCase[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [casesRes, profilesRes] = await Promise.all([
        supabase
          .from("survey_cases")
          .select("*, assigned_profile:profiles!assigned_to(*)")
          .not("scheduled_date", "is", null),
        supabase.from("profiles").select("*"),
      ]);

      if (casesRes.data) {
        setAllCases(casesRes.data as SurveyCase[]);
      }
      if (profilesRes.data) {
        setProfiles(profilesRes.data as Profile[]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = allCases;
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((c) => c.assigned_to === assigneeFilter);
    }

    const calEvents: EventInput[] = filtered.map((c) => {
      let start = c.scheduled_date!;
      let end = c.scheduled_date!;

      if (c.scheduled_time_start) {
        start = `${c.scheduled_date}T${c.scheduled_time_start}`;
      }
      if (c.scheduled_time_end) {
        end = `${c.scheduled_date}T${c.scheduled_time_end}`;
      } else if (c.scheduled_time_start) {
        const [h, m] = c.scheduled_time_start.split(":").map(Number);
        const endH = h + 1;
        end = `${c.scheduled_date}T${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      }

      return {
        id: c.id,
        title: `${c.client_name} - ${c.address}`,
        start,
        end,
        backgroundColor: STATUS_CALENDAR_COLORS[c.status],
        borderColor: STATUS_CALENDAR_COLORS[c.status],
        extendedProps: {
          case_number: c.case_number,
          status: c.status,
          assigned_profile: c.assigned_profile,
        },
      };
    });
    setEvents(calEvents);
  }, [allCases, assigneeFilter]);

  const handleEventClick = (info: EventClickArg) => {
    router.push(`/cases/${info.event.id}`);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    if (!isAdmin) {
      info.revert();
      toast.error("管理者のみスケジュール変更が可能です");
      return;
    }

    const newDate = info.event.start;
    if (!newDate) {
      info.revert();
      return;
    }

    const supabase = createClient();
    const dateStr = newDate.toISOString().split("T")[0];
    const timeStr = newDate.toTimeString().slice(0, 8);

    const { error } = await supabase
      .from("survey_cases")
      .update({
        scheduled_date: dateStr,
        scheduled_time_start: timeStr !== "00:00:00" ? timeStr : undefined,
      })
      .eq("id", info.event.id);

    if (error) {
      info.revert();
      toast.error("スケジュールの更新に失敗しました");
    } else {
      toast.success("スケジュールを更新しました");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <div className="flex gap-3">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="担当者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全担当者</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(CASE_STATUS_LABELS) as [CaseStatus, string][]).map(
          ([status, label]) => (
            <Badge
              key={status}
              variant="outline"
              className="gap-1.5 text-xs font-normal"
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_CALENDAR_COLORS[status] }}
              />
              {label}
            </Badge>
          )
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[700px] w-full rounded-lg" />
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="ja"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "今日",
                month: "月",
                week: "週",
                day: "日",
              }}
              events={events}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              editable={isAdmin}
              droppable={isAdmin}
              dayMaxEvents={3}
              nowIndicator
              height="auto"
              eventDisplay="block"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
              }}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
