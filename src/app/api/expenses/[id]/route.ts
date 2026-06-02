import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Category } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: {
      amount?: string | number;
      category?: string;
      description?: string;
      date?: string;
    } = await req.json();
    const { amount, category, description, date } = body;

    const data: Record<string, any> = {};
    if (amount !== undefined) data.amount = parseFloat(String(amount));
    if (category !== undefined) data.category = category as Category;
    if (description !== undefined) data.description = description;
    if (date !== undefined) data.date = new Date(date);

    const expense = await prisma.expense.update({ where: { id }, data });
    return NextResponse.json(expense);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
