"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { ExpenseWithId } from "@/types";
import {
  Wallet,
  CalendarDays,
  TrendingUp,
  PiggyBank,
} from "lucide-react";

interface AnalyticsData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
}

interface BudgetItem {
  monthlyLimit: number;
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithId[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, expensesRes, budgetsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/expenses?limit=10"),
          fetch("/api/budgets"),
        ]);
        const [a, e, b] = await Promise.all([
          analyticsRes.json(),
          expensesRes.json(),
          budgetsRes.json(),
        ]);
        setAnalytics(a);
        setExpenses(e);
        setBudgets(b);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalBudget = budgets.reduce((s: number, b: BudgetItem) => s + b.monthlyLimit, 0);
  const remainingBudget = totalBudget - (analytics?.monthTotal ?? 0);

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Spend"
          value={loading ? "—" : formatINR(analytics?.todayTotal ?? 0)}
          icon={Wallet}
          loading={loading}
          subtitle="All categories combined"
        />
        <StatCard
          title="Weekly Spend"
          value={loading ? "—" : formatINR(analytics?.weekTotal ?? 0)}
          icon={CalendarDays}
          loading={loading}
          subtitle="Last 7 days"
        />
        <StatCard
          title="Monthly Spend"
          value={loading ? "—" : formatINR(analytics?.monthTotal ?? 0)}
          icon={TrendingUp}
          loading={loading}
          subtitle="Current month total"
        />
        <StatCard
          title="Remaining Budget"
          value={
            loading
              ? "—"
              : totalBudget === 0
              ? "No budgets set"
              : formatINR(remainingBudget)
          }
          icon={PiggyBank}
          loading={loading}
          trend={
            remainingBudget < 0
              ? "down"
              : remainingBudget < totalBudget * 0.2
              ? "down"
              : "up"
          }
          subtitle={
            totalBudget > 0
              ? `of ${formatINR(totalBudget)} total budget`
              : undefined
          }
        />
      </div>

      {/* Recent transactions */}
      <RecentTransactions expenses={expenses} loading={loading} />
    </div>
  );
}
