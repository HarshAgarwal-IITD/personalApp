import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category && category !== "ALL") where.category = category;
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
    });

    const rows = expenses.map((e) => ({
      Date: format(new Date(e.date), "dd/MM/yyyy"),
      Category: e.category,
      Amount: e.amount,
      Description: e.description || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
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
