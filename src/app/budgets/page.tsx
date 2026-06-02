"use client";

import { useCallback, useEffect, useState } from "react";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetDialog } from "@/components/budgets/BudgetDialog";
import { BudgetWithId, BudgetWithUsage, CATEGORY_LABELS } from "@/types";
import { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ExpenseEntry {
  category: Category;
  amount: number;
}

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState<BudgetWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetWithId | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, expensesRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}&year=${year}`),
        fetch(
          `/api/expenses?startDate=${year}-${String(month).padStart(2, "0")}-01&endDate=${year}-${String(month).padStart(2, "0")}-31`
        ),
      ]);
      const rawBudgets: BudgetWithId[] = await budgetsRes.json();
      const rawExpenses: ExpenseEntry[] = await expensesRes.json();

      // Compute spent per category
      const spentMap: Partial<Record<Category, number>> = {};
      for (const e of rawExpenses) {
        spentMap[e.category] = (spentMap[e.category] || 0) + e.amount;
      }

      const enriched: BudgetWithUsage[] = rawBudgets.map((b) => {
        const spent = spentMap[b.category as Category] || 0;
        const remaining = b.monthlyLimit - spent;
        const percentage = Math.round((spent / b.monthlyLimit) * 100);
        return { ...b, spent, remaining, percentage };
      });

      setBudgets(enriched);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/budgets/${deleteTarget}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* Month selector + add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            id="prev-month-btn"
            variant="outline"
            size="icon"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-semibold">
            {monthLabel}
          </span>
          <Button
            id="next-month-btn"
            variant="outline"
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button id="add-budget-btn" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Set Budget
        </Button>
      </div>

      {/* Budget cards grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No budgets set for {monthLabel}.
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-1"
              onClick={() => setAddOpen(true)}
            >
              Set your first budget →
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={() => setEditTarget(b)}
              onDelete={() => setDeleteTarget(b.id)}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <BudgetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        month={month}
        year={year}
        onSave={async (data) => {
          await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          setAddOpen(false);
          fetchBudgets();
        }}
      />

      {/* Edit dialog */}
      {editTarget && (
        <BudgetDialog
          open={!!editTarget}
          onOpenChange={(o) => !o && setEditTarget(null)}
          budget={editTarget}
          month={month}
          year={year}
          onSave={async (data) => {
            await fetch(`/api/budgets/${editTarget.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ monthlyLimit: data.monthlyLimit }),
            });
            setEditTarget(null);
            fetchBudgets();
          }}
        />
      )}

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this budget? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
