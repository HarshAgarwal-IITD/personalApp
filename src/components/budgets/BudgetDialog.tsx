"use client";

import { useState } from "react";
import { BudgetWithId, ALL_CATEGORIES, CATEGORY_LABELS } from "@/types";
import { Category } from "@/types";
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

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetWithId;
  month: number;
  year: number;
  onSave: (data: {
    category: Category;
    monthlyLimit: number;
    month: number;
    year: number;
  }) => Promise<void>;
}

export function BudgetDialog({
  open,
  onOpenChange,
  budget,
  month,
  year,
  onSave,
}: BudgetDialogProps) {
  const [category, setCategory] = useState<Category>(
    (budget?.category as Category) ?? "FOOD"
  );
  const [limit, setLimit] = useState(budget?.monthlyLimit?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!limit || !category) return;
    setSaving(true);
    try {
      await onSave({
        category,
        monthlyLimit: parseFloat(limit),
        month,
        year,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Set Budget"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bud-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
              disabled={!!budget}
            >
              <SelectTrigger id="bud-category">
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
            <Label htmlFor="bud-limit">Monthly Limit (₹)</Label>
            <Input
              id="bud-limit"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !limit}>
            {saving ? "Saving…" : budget ? "Update" : "Set Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
