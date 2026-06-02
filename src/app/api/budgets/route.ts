import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!, 10)
      : new Date().getMonth() + 1;
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!, 10)
      : new Date().getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { month, year },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, monthlyLimit, month, year } = body;

    if (!category || !monthlyLimit) {
      return NextResponse.json(
        { error: "category and monthlyLimit are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();

    const budget = await prisma.budget.upsert({
      where: { category_month_year: { category, month: m, year: y } },
      update: { monthlyLimit: parseFloat(monthlyLimit) },
      create: {
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        month: m,
        year: y,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
