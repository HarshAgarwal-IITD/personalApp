import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";

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
    const body: {
      category?: string;
      monthlyLimit?: string | number;
      month?: number;
      year?: number;
    } = await req.json();
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
    const cat = category as Category;
    const limit = parseFloat(String(monthlyLimit));

    const budget = await prisma.budget.upsert({
      where: { category_month_year: { category: cat, month: m, year: y } },
      update: { monthlyLimit: limit },
      create: { category: cat, monthlyLimit: limit, month: m, year: y },
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
