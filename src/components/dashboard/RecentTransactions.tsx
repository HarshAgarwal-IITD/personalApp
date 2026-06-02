"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, CATEGORY_LABELS, ExpenseWithId } from "@/types";
import { format } from "date-fns";
import { Category } from "@prisma/client";

interface RecentTransactionsProps {
  expenses: ExpenseWithId[];
  loading?: boolean;
}

export function RecentTransactions({
  expenses,
  loading,
}: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No expenses yet. Start by logging one via Telegram!
          </p>
        ) : (
          <div className="space-y-1">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[expense.category as Category],
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {expense.description || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(expense.date), "d MMM, h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal"
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
                  <span className="text-sm font-semibold">
                    ₹{expense.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
