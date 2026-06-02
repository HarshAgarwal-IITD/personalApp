import { prisma } from "@/lib/prisma";
import { HABIT_KEYS, HabitKey, computeXP } from "@/lib/habits";
import { computeHabitStreaks, computeOverallStreak } from "@/lib/streaks";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, format, parseISO, isValid } from "date-fns";

// Shape of the parsed habit updates
type HabitUpdateData = {
  exercise?: boolean;
  meditation?: boolean;
  nof?: boolean;
  reading?: boolean;
  socialising?: boolean;
  officeWork?: boolean;
  learning?: boolean;
  winOfDay?: string;
  xp?: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const [habitStreaks, overallStreak] = await Promise.all([
        computeHabitStreaks(),
        computeOverallStreak(),
      ]);

      const logs = await prisma.dailyLog.findMany({
        orderBy: { date: "desc" },
        take: 60,
      });

      const heatmap = logs.map((l) => ({
        date: format(new Date(l.date), "yyyy-MM-dd"),
        xp: l.xp,
      }));

      return NextResponse.json({ habitStreaks, overallStreak, heatmap });
    }

    const dateParam = searchParams.get("date");
    let date: Date;
    if (dateParam) {
      const parsed = parseISO(dateParam);
      date = isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
    } else {
      date = startOfDay(new Date());
    }

    const log = await prisma.dailyLog.findUnique({ where: { date } });
    return NextResponse.json(log ?? { date: date.toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Record<string, unknown> = await req.json();
    const { date: dateStr, winOfDay, ...habitFields } = body;

    const date =
      typeof dateStr === "string"
        ? startOfDay(parseISO(dateStr))
        : startOfDay(new Date());

    const update: HabitUpdateData = {};
    for (const key of HABIT_KEYS) {
      if (habitFields[key] !== undefined) {
        (update as Record<string, unknown>)[key] = Boolean(habitFields[key]);
      }
    }
    if (winOfDay !== undefined) update.winOfDay = String(winOfDay);

    // Merge with existing to compute XP
    const existing = await prisma.dailyLog.findUnique({ where: { date } });
    const merged = Object.fromEntries(
      HABIT_KEYS.map((k) => [k, existing ? Boolean(existing[k as keyof typeof existing]) : false])
    );
    for (const key of HABIT_KEYS) {
      if (habitFields[key] !== undefined) merged[key] = Boolean(habitFields[key]);
    }
    update.xp = computeXP(merged as Record<HabitKey, boolean>);

    const log = await prisma.dailyLog.upsert({
      where: { date },
      update,
      create: { date, ...update },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update habits" }, { status: 500 });
  }
}
