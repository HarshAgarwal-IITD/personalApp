"use client";

import { useState } from "react";
import { HabitsTab } from "@/components/tasks/HabitsTab";
import { TasksTab } from "@/components/tasks/TasksTab";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const [tab, setTab] = useState<"habits" | "tasks">("habits");

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-card p-1 w-fit gap-1">
        {(["habits", "tasks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all duration-200",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "habits" ? "🏆 Daily Habits" : "✅ To-Do List"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "habits" ? <HabitsTab /> : <TasksTab />}
    </div>
  );
}
