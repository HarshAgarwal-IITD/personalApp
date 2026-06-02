"use client";

import { useState } from "react";
import { ExpenseWithId, CATEGORY_COLORS, CATEGORY_LABELS, ALL_CATEGORIES } from "@/types";
import { Category } from "@prisma/client";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExpenseDialog } from "./ExpenseDialog";

interface ExpenseTableProps {
  expenses: ExpenseWithId[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<ExpenseWithId>) => void;
}

export function ExpenseTable({
  expenses,
  loading,
  onDelete,
  onEdit,
}: ExpenseTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ExpenseWithId | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/expenses/${deleteTarget}`, { method: "DELETE" });
    onDelete(deleteTarget);
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No expenses found. Adjust filters or add expenses via Telegram.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Description</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="group">
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(expense.date), "d MMM yyyy")}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[expense.category as Category] + "20",
                      color: CATEGORY_COLORS[expense.category as Category],
                      borderColor:
                        CATEGORY_COLORS[expense.category as Category] + "40",
                    }}
                  >
                    {CATEGORY_LABELS[expense.category as Category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {expense.description || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₹{expense.amount.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditTarget(expense)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(expense.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this expense? This action cannot be undone.
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

      {/* Edit dialog */}
      {editTarget && (
        <ExpenseDialog
          open={!!editTarget}
          onOpenChange={(o) => !o && setEditTarget(null)}
          expense={editTarget}
          onSave={async (data) => {
            const res = await fetch(`/api/expenses/${editTarget.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            const updated = await res.json();
            onEdit(editTarget.id, updated);
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}
