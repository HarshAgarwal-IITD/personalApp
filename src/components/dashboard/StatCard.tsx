"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  loading,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            )}
            {subtitle && (
              <p
                className={cn(
                  "text-xs",
                  trend === "up" && "text-emerald-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-muted-foreground",
                  !trend && "text-muted-foreground"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
      </CardContent>
    </Card>
  );
}
