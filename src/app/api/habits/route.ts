import { prisma } from "@/lib/prisma";
import { HABIT_KEYS, HabitKey, computeXP } from "@/lib/habits";
import { computeHabitStreaks, computeOverallStreak } from "@/lib/streaks";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, format, parseISO, isValid } from "date-fns";

// GET /api/habits?date=YYYY-MM-DD  — get log for a day
// GET /api/habits?stats=true       — get streaks + weekly XP
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const [habitStreaks, overallStreak] = await Promise.all([
        computeHabitStreaks(),
        computeOverallStreak(),
      ]);

      // Last 30 days XP for heatmap
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

    // Get specific day (default today)
    const dateParam = searchParams.get("date");
    let date: Date;
    if (dateParam) {
      const parsed = parseISO(dateParam);
      date = isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
    } else {
      date = startOfDay(new Date());
    }

    const log = await prisma.dailyLog.findUnique({
      where: { date },
    });

    return NextResponse.json(log ?? { date: date.toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

// POST /api/habits — upsert today's log
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date: dateStr, winOfDay, ...habitFields } = body;

    const date = dateStr
      ? startOfDay(parseISO(dateStr))
      : startOfDay(new Date());

    // Build update data — only include valid habit keys
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    for (const key of HABIT_KEYS) {
      if (habitFields[key] !== undefined) data[key] = Boolean(habitFields[key]);
    }
    if (winOfDay !== undefined) data.winOfDay = winOfDay;

    // Fetch current state to compute XP correctly
    const existing = await prisma.dailyLog.findUnique({ where: { date } });
    const merged = { ...Object.fromEntries(HABIT_KEYS.map((k) => [k, existing?.[k] ?? false])), ...data };
    data.xp = computeXP(merged as Record<HabitKey, boolean>);

    const log = await prisma.dailyLog.upsert({
      where: { date },
      update: data,
      create: { date, ...data },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update habits" }, { status: 500 });
  }
}
