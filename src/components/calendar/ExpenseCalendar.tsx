"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { Category } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ExpenseDay {
  date: string;
  total: number;
  count: number;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description: string | null;
  }>;
}

interface CalendarData {
  days: ExpenseDay[];
  monthTotal: number;
}

function heatColor(total: number, max: number): string {
  if (total === 0) return "";
  const intensity = Math.min(total / max, 1);
  if (intensity > 0.8) return "bg-red-500/80 text-white";
  if (intensity > 0.5) return "bg-orange-500/60";
  if (intensity > 0.2) return "bg-amber-400/50";
  return "bg-emerald-400/40";
}

export function ExpenseCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?type=expenses&month=${month}&year=${year}`);
    setData(await res.json());
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

  const dayMap = Object.fromEntries(
    (data?.days ?? []).map((d) => [d.date, d])
  );

  const maxTotal = Math.max(...(data?.days ?? []).map((d) => d.total), 1);
  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");
  const selectedDay = selected ? dayMap[selected] : null;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {!loading && data && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
          <p className="text-sm font-semibold">
            Total: ₹{data.monthTotal.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      <div className={cn("grid gap-6", selectedDay && selectedDay.count > 0 ? "lg:grid-cols-[1fr_300px]" : "")}>
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
                if (!day || day.total === 0) return null;
                return (
                  <span
                    className={cn(
                      "w-full rounded-lg px-1 py-0.5 text-center text-[10px] font-semibold leading-tight",
                      heatColor(day.total, maxTotal)
                    )}
                  >
                    ₹{day.total >= 1000
                      ? `${(day.total / 1000).toFixed(1)}k`
                      : day.total.toFixed(0)}
                  </span>
                );
              }}
            />
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 justify-end">
            <span className="text-xs text-muted-foreground">Less</span>
            {["bg-emerald-400/40", "bg-amber-400/50", "bg-orange-500/60", "bg-red-500/80"].map((c, i) => (
              <div key={i} className={cn("h-3 w-3 rounded-sm", c)} />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && selectedDay.count > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">
                  {format(new Date(selectedDay.date + "T00:00:00"), "EEEE, d MMM")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDay.count} expense{selectedDay.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹{selectedDay.total.toLocaleString("en-IN")}</p>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {selectedDay.expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[e.category as Category] }}
                    />
                    <div>
                      <p className="text-xs font-medium">{e.description || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {CATEGORY_LABELS[e.category as Category]}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold">₹{e.amount.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDay && selectedDay.count === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No expenses on this day 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
