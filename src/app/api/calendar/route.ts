import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  parseISO,
  isValid,
} from "date-fns";

// GET /api/calendar?month=6&year=2026&type=expenses|habits
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "expenses";
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!, 10)
      : new Date().getMonth() + 1;
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!, 10)
      : new Date().getFullYear();

    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: "asc" },
      });

      // Group by day
      const dayMap: Record<string, { total: number; count: number; expenses: typeof expenses }> = {};
      for (const e of expenses) {
        const key = format(new Date(e.date), "yyyy-MM-dd");
        if (!dayMap[key]) dayMap[key] = { total: 0, count: 0, expenses: [] };
        dayMap[key].total += e.amount;
        dayMap[key].count += 1;
        dayMap[key].expenses.push(e);
      }

      const days = allDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        return {
          date: key,
          total: dayMap[key]?.total ?? 0,
          count: dayMap[key]?.count ?? 0,
          expenses: dayMap[key]?.expenses ?? [],
        };
      });

      return NextResponse.json({ days, monthTotal: expenses.reduce((s, e) => s + e.amount, 0) });
    }

    if (type === "habits") {
      const logs = await prisma.dailyLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: "asc" },
      });

      const logMap: Record<string, typeof logs[0]> = {};
      for (const l of logs) {
        logMap[format(new Date(l.date), "yyyy-MM-dd")] = l;
      }

      const days = allDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const log = logMap[key];
        return {
          date: key,
          xp: log?.xp ?? 0,
          exercise: log?.exercise ?? false,
          meditation: log?.meditation ?? false,
          nof: log?.nof ?? false,
          reading: log?.reading ?? false,
          socialising: log?.socialising ?? false,
          officeWork: log?.officeWork ?? false,
          learning: log?.learning ?? false,
          winOfDay: log?.winOfDay ?? null,
          hasLog: !!log,
        };
      });

      return NextResponse.json({ days });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
