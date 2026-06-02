"use client";

import { useState } from "react";
import { HabitsTab } from "@/components/tasks/HabitsTab";
import { HabitCalendar } from "@/components/calendar/HabitCalendar";
import { cn } from "@/lib/utils";

type Tab = "habits" | "calendar";

export default function TasksPage() {
  const [tab, setTab] = useState<Tab>("habits");

  const tabs: { id: Tab; label: string }[] = [
    { id: "habits",   label: "🏆 Today's Habits" },
    { id: "calendar", label: "📅 Habit Calendar"  },
  ];

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-card p-1 w-fit gap-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "habits"   && <HabitsTab />}
      {tab === "calendar" && <HabitCalendar />}
    </div>
  );
}
