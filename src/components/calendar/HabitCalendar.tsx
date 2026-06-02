"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { HABITS } from "@/lib/habits";
import { getRank } from "@/lib/habits";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface HabitDay {
  date: string;
  xp: number;
  exercise: boolean;
  meditation: boolean;
  nof: boolean;
  reading: boolean;
  socialising: boolean;
  officeWork: boolean;
  learning: boolean;
  winOfDay: string | null;
  hasLog: boolean;
}

function xpToColor(xp: number): string {
  if (xp === 0)  return "";
  if (xp >= 90)  return "bg-yellow-400 text-yellow-900";
  if (xp >= 70)  return "bg-blue-500/80 text-white";
  if (xp >= 50)  return "bg-orange-500/70 text-white";
  if (xp >= 30)  return "bg-purple-500/60 text-white";
  return              "bg-muted-foreground/30 text-foreground";
}

export function HabitCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [days, setDays] = useState<HabitDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?type=habits&month=${month}&year=${year}`);
    const json = await res.json();
    setDays(json.days ?? []);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));
  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const selectedDay = selected ? dayMap[selected] : null;

  // Monthly stats
  const loggedDays = days.filter((d) => d.hasLog);
  const avgXP = loggedDays.length
    ? Math.round(loggedDays.reduce((s, d) => s + d.xp, 0) / loggedDays.length)
    : 0;
  const perfectDays = days.filter((d) => d.xp === 100).length;

  return (
    <div className="space-y-4">
      {/* Monthly summary chips */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Logged days </span>
            <span className="font-semibold">{loggedDays.length}</span>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">Avg XP </span>
            <span className="font-semibold">{avgXP}</span>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">👑 Perfect days </span>
            <span className="font-semibold">{perfectDays}</span>
          </div>
        </div>
      )}

      <div className={cn("grid gap-6", selectedDay?.hasLog ? "lg:grid-cols-[1fr_280px]" : "")}>
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card p-4">
          {loading ? (
            <div className="h-80 animate-pulse rounded-lg bg-muted" />
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              onPrev={prevMonth}
              onNext={nextMonth}
              monthLabel={monthLabel}
              selectedDate={selected}
              onDayClick={(date) => setSelected((prev) => prev === date ? null : date)}
              renderDay={(dateStr) => {
                const day = dayMap[dateStr];
                if (!day?.hasLog) return null;
                const rank = getRank(day.xp);
                return (
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    <span
                      className={cn(
                        "w-full rounded-md px-1 py-0.5 text-center text-[10px] font-bold leading-tight",
                        xpToColor(day.xp)
                      )}
                    >
                      {day.xp}
                    </span>
                    <span className="text-[10px] leading-none">{rank.emoji}</span>
                  </div>
                );
              }}
            />
          )}

          {/* XP legend */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {[
              { color: "bg-muted-foreground/30", label: "1–29 XP" },
              { color: "bg-purple-500/60", label: "30–49" },
              { color: "bg-orange-500/70", label: "50–69" },
              { color: "bg-blue-500/80", label: "70–89" },
              { color: "bg-yellow-400", label: "90–100 👑" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={cn("h-3 w-3 rounded-sm", color)} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay?.hasLog && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {format(new Date(selectedDay.date + "T00:00:00"), "EEEE, d MMM")}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-bold">{selectedDay.xp} XP</span>
                  <span className="text-base">{getRank(selectedDay.xp).emoji}</span>
                  <span className="text-xs text-muted-foreground">{getRank(selectedDay.xp).label}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground mt-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Habit checklist for that day */}
            <div className="space-y-1.5">
              {HABITS.map((h) => {
                const done = selectedDay[h.key as keyof HabitDay] as boolean;
                return (
                  <div
                    key={h.key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs",
                      done ? "bg-primary/10" : "bg-muted/30 opacity-50"
                    )}
                  >
                    <span>{done ? "✅" : "⬜"}</span>
                    <span className="flex-1 font-medium">{h.label}</span>
                    {done && (
                      <span className="text-primary font-semibold">+{h.xp}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDay.winOfDay && (
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground">🏅 Win of the day</p>
                <p className="text-xs font-medium mt-0.5">{selectedDay.winOfDay}</p>
              </div>
            )}
          </div>
        )}

        {selected && !selectedDay?.hasLog && (
          <div className="rounded-xl border border-dashed border-border bg-card p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No habits logged this day</p>
          </div>
        )}
      </div>
    </div>
  );
}
