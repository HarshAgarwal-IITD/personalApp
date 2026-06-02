"use client";

import { useEffect, useState } from "react";
import { Priority } from "@prisma/client";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Plus, Trash2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  HIGH:   { label: "High",   color: "text-red-500",    dot: "bg-red-500" },
  MEDIUM: { label: "Medium", color: "text-amber-500",  dot: "bg-amber-500" },
  LOW:    { label: "Low",    color: "text-emerald-500", dot: "bg-emerald-500" },
};

function dueDateLabel(dueDate: string | null): { label: string; urgent: boolean } | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isToday(d))    return { label: "Due today",    urgent: true };
  if (isTomorrow(d)) return { label: "Due tomorrow", urgent: false };
  if (isPast(d))     return { label: `Overdue · ${format(d, "d MMM")}`, urgent: true };
  return { label: `Due ${format(d, "d MMM")}`, urgent: false };
}

export function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("MEDIUM");
  const [newDue, setNewDue] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        priority: newPriority,
        dueDate: newDue || null,
      }),
    });
    const task = await res.json();
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setNewDue("");
    setNewPriority("MEDIUM");
    setShowAddForm(false);
    setAdding(false);
  };

  const toggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Filter tabs */}
        <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
          {(["active", "all", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "active" ? `Active (${activeCount})` : f === "done" ? "Done" : "All"}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
          <Input
            id="new-task-title"
            autoFocus
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <div className="flex gap-2">
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">🔴 High</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="LOW">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-40"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
            <Button onClick={addTask} disabled={adding || !newTitle.trim()} className="ml-auto">
              {adding ? "Adding…" : "Add"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            {filter === "active" ? "All caught up! 🎉" : "No tasks here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const pc = PRIORITY_CONFIG[task.priority];
            const due = dueDateLabel(task.dueDate);

            return (
              <div
                key={task.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150",
                  task.completed
                    ? "border-border bg-muted/30 opacity-60"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                )}
              >
                {/* Priority dot */}
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-0.5", pc.dot)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-xs", pc.color)}>{pc.label}</span>
                    {due && (
                      <span className={cn("text-xs", due.urgent ? "text-red-500" : "text-muted-foreground")}>
                        · {due.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleComplete(task)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      task.completed
                        ? "bg-muted text-muted-foreground hover:bg-muted"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
