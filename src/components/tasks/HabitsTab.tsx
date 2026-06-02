"use client";

import { useCallback, useEffect, useState } from "react";
import { HABITS, MAX_XP, getRank, HabitKey } from "@/lib/habits";
import { cn } from "@/lib/utils";

interface DailyLog {
  exercise: boolean;
  meditation: boolean;
  nof: boolean;
  reading: boolean;
  socialising: boolean;
  officeWork: boolean;
  learning: boolean;
  winOfDay: string;
  xp: number;
}

interface HabitStreaks {
  habitStreaks: Record<HabitKey, number>;
  overallStreak: number;
}

export function HabitsTab() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [log, setLog] = useState<Partial<DailyLog>>({});
  const [streaks, setStreaks] = useState<HabitStreaks | null>(null);
  const [winOfDay, setWinOfDay] = useState("");
  const [saving, setSaving] = useState<HabitKey | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [logRes, statsRes] = await Promise.all([
      fetch(`/api/habits?date=${todayStr}`),
      fetch("/api/habits?stats=true"),
    ]);
    const [logData, statsData] = await Promise.all([
      logRes.json(),
      statsRes.json(),
    ]);
    setLog(logData);
    setWinOfDay(logData.winOfDay ?? "");
    setStreaks(statsData);
    setLoading(false);
  }, [todayStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const xp = HABITS.reduce(
    (sum: number, h: typeof HABITS[number]) => sum + (log[h.key as HabitKey] ? h.xp : 0),
    0
  );
  const rank = getRank(xp);
  const pct = Math.round((xp / MAX_XP) * 100);

  const toggleHabit = async (key: HabitKey) => {
    const newVal = !log[key];
    setLog((prev) => ({ ...prev, [key]: newVal }));
    setSaving(key);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, [key]: newVal }),
    });
    // Refresh streaks
    const statsRes = await fetch("/api/habits?stats=true");
    setStreaks(await statsRes.json());
    setSaving(null);
  };

  const saveWin = async () => {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, winOfDay }),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Today's XP</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{xp}</span>
              <span className="text-lg text-muted-foreground">/ {MAX_XP}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl">{rank.emoji}</div>
            <p className="text-sm font-semibold">{rank.label}</p>
            {streaks && (
              <p className="text-xs text-muted-foreground mt-0.5">
                🔥 {streaks.overallStreak}d overall streak
              </p>
            )}
          </div>
        </div>

        {/* XP bar */}
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              xp >= 90 ? "bg-yellow-400" :
              xp >= 70 ? "bg-blue-500" :
              xp >= 50 ? "bg-orange-500" :
              xp >= 30 ? "bg-purple-500" : "bg-emerald-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Rank milestones */}
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>🌱 0</span>
          <span>⚡ 30</span>
          <span>🔥 50</span>
          <span>🏆 70</span>
          <span>👑 90</span>
        </div>
      </div>

      {/* Habit checklist */}
      <div className="space-y-2">
        {HABITS.map((habit) => {
          const key = habit.key as HabitKey;
          const done = !!log[key];
          const streak = streaks?.habitStreaks?.[key] ?? 0;

          return (
            <button
              key={key}
              onClick={() => toggleHabit(key)}
              disabled={saving === key}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                done
                  ? "border-primary/40 bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground"
                )}
              >
                {done && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Emoji + Label */}
              <span className="text-xl flex-shrink-0">{habit.emoji}</span>
              <div className="flex-1">
                <p className={cn("font-medium", done && "line-through text-muted-foreground")}>
                  {habit.label}
                </p>
                {streak > 0 && (
                  <p className="text-xs text-orange-500 font-medium mt-0.5">
                    🔥 {streak} day streak
                  </p>
                )}
              </div>

              {/* XP badge */}
              <span
                className={cn(
                  "ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  done
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                +{habit.xp} XP
              </span>
            </button>
          );
        })}
      </div>

      {/* Win of the day */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium mb-2">🏅 Win of the Day</p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="What's your biggest win today?"
            value={winOfDay}
            onChange={(e) => setWinOfDay(e.target.value)}
            onBlur={saveWin}
            onKeyDown={(e) => e.key === "Enter" && saveWin()}
          />
        </div>
      </div>
    </div>
  );
}
