import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Priority } from "@prisma/client";

// GET /api/tasks?completed=false
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const completed = searchParams.get("completed");
    const priority = searchParams.get("priority") as Priority | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (completed !== null) where.completed = completed === "true";
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ completed: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority, dueDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
