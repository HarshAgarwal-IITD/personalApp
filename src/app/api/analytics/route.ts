import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Expense } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  subDays,
} from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!, 10)
      : new Date().getFullYear();

    const now = new Date();

    // Today total
    const todayExpenses = await prisma.expense.findMany({
      where: { date: { gte: startOfDay(now), lte: endOfDay(now) } },
    });
    const todayTotal = todayExpenses.reduce((s: number, e: Expense) => s + e.amount, 0);

    // Week total (last 7 days)
    const weekExpenses = await prisma.expense.findMany({
      where: { date: { gte: startOfDay(subDays(now, 6)), lte: endOfDay(now) } },
    });
    const weekTotal = weekExpenses.reduce((s: number, e: Expense) => s + e.amount, 0);

    // Month total
    const monthExpenses = await prisma.expense.findMany({
      where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    });
    const monthTotal = monthExpenses.reduce((s: number, e: Expense) => s + e.amount, 0);

    // Category breakdown (current month)
    const categoryMap: Record<string, number> = {};
    for (const e of monthExpenses) {
      categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(
      ([category, total]) => ({ category, total })
    );

    // Daily totals (current month)
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailyMap: Record<string, number> = {};
    for (const e of monthExpenses) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      dailyMap[key] = (dailyMap[key] ?? 0) + e.amount;
    }
    const dailyTotals = allDays.map((day) => ({
      date: format(day, "d MMM"),
      total: dailyMap[format(day, "yyyy-MM-dd")] ?? 0,
    }));

    // Monthly totals for the given year
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const yearExpenses = await prisma.expense.findMany({
      where: { date: { gte: yearStart, lte: yearEnd } },
    });
    const allMonths = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    const monthMap: Record<string, number> = {};
    for (const e of yearExpenses) {
      const key = format(new Date(e.date), "yyyy-MM");
      monthMap[key] = (monthMap[key] ?? 0) + e.amount;
    }
    const monthlyTotals = allMonths.map((m) => ({
      month: format(m, "MMM"),
      total: monthMap[format(m, "yyyy-MM")] ?? 0,
    }));

    return NextResponse.json({
      todayTotal,
      weekTotal,
      monthTotal,
      categoryBreakdown,
      dailyTotals,
      monthlyTotals,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
