import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: { monthlyLimit?: string | number } = await req.json();
    const { monthlyLimit } = body;

    const data: Record<string, any> = {};
    if (monthlyLimit !== undefined) {
      data.monthlyLimit = parseFloat(String(monthlyLimit));
    }

    const budget = await prisma.budget.update({ where: { id }, data });
    return NextResponse.json(budget);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update budget" },
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
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
