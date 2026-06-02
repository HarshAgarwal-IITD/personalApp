import { prisma } from "@/lib/prisma";
import { HABITS, HABIT_KEYS, HabitKey, computeXP } from "@/lib/habits";
import { startOfDay } from "date-fns";

/**
 * Calculate the per-habit streak for every habit key.
 * Streak = consecutive days ending today (or yesterday if today has no log)
 * where that specific habit was completed.
 */
export async function computeHabitStreaks(): Promise<Record<HabitKey, number>> {
  // Fetch all logs newest-first
  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: "desc" },
  });

  const streaks = Object.fromEntries(
    HABIT_KEYS.map((k) => [k, 0])
  ) as Record<HabitKey, number>;

  for (const habitDef of HABITS) {
    const key = habitDef.key as HabitKey;
    let streak = 0;
    let expectedDate: Date | null = null;

    for (const log of logs) {
      const logDay = startOfDay(new Date(log.date));

      if (expectedDate === null) {
        // First log — start from here if habit is done
        if (log[key]) {
          streak = 1;
          expectedDate = new Date(logDay);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break; // Most recent day not done → streak is 0
        }
      } else {
        const expected = startOfDay(expectedDate);
        if (logDay.getTime() === expected.getTime()) {
          if (log[key]) {
            streak++;
            expectedDate = new Date(logDay);
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break; // Gap in streak
          }
        } else {
          break; // Non-consecutive day
        }
      }
    }

    streaks[key] = streak;
  }

  return streaks;
}

/**
 * Overall streak: consecutive days where XP >= 50
 */
export async function computeOverallStreak(): Promise<number> {
  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: "desc" },
  });

  let streak = 0;
  let expectedDate: Date | null = null;

  for (const log of logs) {
    const logDay = startOfDay(new Date(log.date));
    const xp = computeXP(
      Object.fromEntries(HABIT_KEYS.map((k) => [k, log[k]])) as Record<HabitKey, boolean>
    );

    if (expectedDate === null) {
      if (xp >= 50) {
        streak = 1;
        expectedDate = new Date(logDay);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      const expected = startOfDay(expectedDate);
      if (logDay.getTime() === expected.getTime()) {
        if (xp >= 50) {
          streak++;
          expectedDate = new Date(logDay);
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  return streak;
}
