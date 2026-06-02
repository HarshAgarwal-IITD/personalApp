"use client";

import { getDay, getDaysInMonth, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  year: number;
  month: number; // 1-indexed
  onPrev: () => void;
  onNext: () => void;
  monthLabel: string;
  /** Called with "yyyy-MM-dd" when a day cell is clicked */
  onDayClick?: (date: string) => void;
  /** Extra content rendered inside each day cell */
  renderDay: (dateStr: string, dayNum: number) => React.ReactNode;
  /** Optional: highlight a selected date */
  selectedDate?: string | null;
}

export function CalendarGrid({
  year,
  month,
  onPrev,
  onNext,
  monthLabel,
  onDayClick,
  renderDay,
  selectedDate,
}: CalendarGridProps) {
  const firstDay = getDay(startOfMonth(new Date(year, month - 1, 1)));
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));

  // Build grid cells: leading empty + day cells
  const cells: Array<{ empty: true } | { day: number; dateStr: string }> = [
    ...Array.from({ length: firstDay }, () => ({ empty: true as const })),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return { day, dateStr: `${year}-${mm}-${dd}` };
    }),
  ];

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if ("empty" in cell) {
            return <div key={`e-${idx}`} />;
          }

          const isSelected = selectedDate === cell.dateStr;
          const isToday =
            cell.dateStr === new Date().toISOString().split("T")[0];

          return (
            <button
              key={cell.dateStr}
              onClick={() => onDayClick?.(cell.dateStr)}
              className={cn(
                "relative flex flex-col items-center rounded-xl p-1 min-h-[56px] text-xs transition-all duration-150",
                "border border-transparent",
                onDayClick && "hover:border-primary/40 hover:bg-accent/30 cursor-pointer",
                isSelected && "border-primary bg-primary/10 shadow-sm",
                isToday && !isSelected && "border-primary/30"
              )}
            >
              <span
                className={cn(
                  "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                  !isToday && isSelected && "font-bold"
                )}
              >
                {cell.day}
              </span>
              {renderDay(cell.dateStr, cell.day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
