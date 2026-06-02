"use client";

import { BudgetWithUsage, CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import { Category } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  budget: BudgetWithUsage;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const color = CATEGORY_COLORS[budget.category as Category];
  const isOverBudget = budget.remaining < 0;
  const pct = Math.min(budget.percentage, 100);

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-5">
        {/* Color accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
          style={{ backgroundColor: color }}
        />

        <div className="ml-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">
                {CATEGORY_LABELS[budget.category as Category]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly Limit: ₹{budget.monthlyLimit.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-xl font-bold">
                ₹{budget.spent.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p
                className={cn(
                  "text-xl font-bold",
                  isOverBudget ? "text-destructive" : "text-emerald-500"
                )}
              >
                {isOverBudget ? "-" : ""}₹
                {Math.abs(budget.remaining).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Usage</span>
              <span
                className={cn(
                  "font-medium",
                  isOverBudget
                    ? "text-destructive"
                    : pct > 75
                    ? "text-amber-500"
                    : "text-emerald-500"
                )}
              >
                {budget.percentage}%
              </span>
            </div>
            <Progress
              value={pct}
              className="h-2"
              style={
                {
                  "--progress-color": isOverBudget
                    ? "hsl(var(--destructive))"
                    : pct > 75
                    ? "#f59e0b"
                    : color,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
