import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Priority } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
      completed?: boolean;
    } = await req.json();
    const { title, description, priority, dueDate, completed } = body;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority as Priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (completed !== undefined) {
      data.completed = completed;
      data.completedAt = completed ? new Date() : null;
    }

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
