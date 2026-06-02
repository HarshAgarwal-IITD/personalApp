import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import * as XLSX from "xlsx";
import { Category } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, any> = {};

    if (category && category !== "ALL") {
      where.category = category as Category;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, any> = {};
      if (startDate) {
        const d = parseISO(startDate);
        if (isValid(d)) dateFilter.gte = startOfDay(d);
      }
      if (endDate) {
        const d = parseISO(endDate);
        if (isValid(d)) dateFilter.lte = endOfDay(d);
      }
      where.date = dateFilter;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const rows = expenses.map((e) => ({
      Date: format(new Date(e.date), "dd/MM/yyyy"),
      Category: e.category,
      Amount: e.amount,
      Description: e.description ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 40 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const rawBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    return new NextResponse(rawBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="expenses-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    );
  }
}
