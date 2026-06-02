"use client";

import { useState } from "react";
import { ExpenseWithId, ALL_CATEGORIES, CATEGORY_LABELS } from "@/types";
import { Category } from "@prisma/client";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseWithId;
  onSave: (data: Partial<ExpenseWithId>) => Promise<void>;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSave,
}: ExpenseDialogProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [category, setCategory] = useState<Category>(
    (expense?.category as Category) ?? "FOOD"
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [date, setDate] = useState(
    expense?.date
      ? format(new Date(expense.date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || !category) return;
    setSaving(true);
    try {
      await onSave({ amount: parseFloat(amount), category, description, date });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount (₹)</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger id="exp-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Description (optional)</Label>
            <Input
              id="exp-desc"
              placeholder="e.g. momos, fuel, june rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !amount}>
            {saving ? "Saving…" : expense ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
