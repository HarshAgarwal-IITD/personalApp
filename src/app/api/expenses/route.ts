import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const d = parseISO(startDate);
        if (isValid(d)) where.date.gte = startOfDay(d);
      }
      if (endDate) {
        const d = parseISO(endDate);
        if (isValid(d)) where.date.lte = endOfDay(d);
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, category, description, date } = body;

    if (!amount || !category) {
      return NextResponse.json(
        { error: "amount and category are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
