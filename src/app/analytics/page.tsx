"use client";

import { useEffect, useState } from "react";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { DailyLineChart } from "@/components/charts/DailyLineChart";
import { CategoryTotal, DailyTotal, MonthlyTotal } from "@/types";

interface AnalyticsData {
  categoryBreakdown: CategoryTotal[];
  monthlyTotals: MonthlyTotal[];
  dailyTotals: DailyTotal[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top row: pie + bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart
          data={data?.categoryBreakdown ?? []}
          loading={loading}
        />
        <MonthlyBarChart
          data={data?.monthlyTotals ?? []}
          loading={loading}
        />
      </div>

      {/* Full-width line chart */}
      <DailyLineChart data={data?.dailyTotals ?? []} loading={loading} />
    </div>
  );
}
