"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_COLORS, CATEGORY_LABELS, CategoryTotal } from "@/types";
import { Category } from "@prisma/client";

interface CategoryPieChartProps {
  data: CategoryTotal[];
  loading?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: CategoryTotal }>;
}) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-lg font-bold">
          ₹{item.value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryPieChart({ data, loading }: CategoryPieChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: CATEGORY_LABELS[d.category as Category] || d.category,
    fill: CATEGORY_COLORS[d.category as Category] || "#6b7280",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Category Breakdown
        </CardTitle>
        <p className="text-xs text-muted-foreground">Current month spending by category</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data for this month
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="total"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
