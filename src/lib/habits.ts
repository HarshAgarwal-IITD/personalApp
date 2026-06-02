// Habit definitions — single source of truth
export const HABITS = [
  { key: "exercise",    label: "Exercise",           emoji: "🏋️", xp: 20 },
  { key: "meditation",  label: "Meditation",          emoji: "🧘", xp: 10 },
  { key: "nof",         label: "NoFap",               emoji: "🔒", xp: 15 },
  { key: "reading",     label: "Reading",             emoji: "📚", xp: 15 },
  { key: "socialising", label: "Socialising",         emoji: "🤝", xp: 10 },
  { key: "officeWork",  label: "Office Work",         emoji: "💻", xp: 20 },
  { key: "learning",    label: "Learn Something New", emoji: "🧠", xp: 10 },
] as const;

export type HabitKey = (typeof HABITS)[number]["key"];
export const HABIT_KEYS = HABITS.map((h) => h.key) as HabitKey[];
export const MAX_XP = HABITS.reduce((s: number, h: typeof HABITS[number]) => s + h.xp, 0); // 100

export function computeXP(log: Partial<Record<HabitKey, boolean>>): number {
  return HABITS.reduce(
    (sum: number, h: typeof HABITS[number]) => sum + (log[h.key] ? h.xp : 0),
    0
  );
}

export function getRank(xp: number): { label: string; emoji: string } {
  if (xp >= 90) return { label: "Legend",   emoji: "👑" };
  if (xp >= 70) return { label: "Elite",    emoji: "🏆" };
  if (xp >= 50) return { label: "Warrior",  emoji: "🔥" };
  if (xp >= 30) return { label: "Explorer", emoji: "⚡" };
  return             { label: "Rookie",   emoji: "🌱" };
}
