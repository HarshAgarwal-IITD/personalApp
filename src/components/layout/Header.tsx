"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your financial overview",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Spending patterns & trends",
  },
  "/expenses": {
    title: "Expenses",
    subtitle: "All your transactions",
  },
  "/budgets": {
    title: "Budgets",
    subtitle: "Monthly budget tracking",
  },
  "/tasks": {
    title: "Tasks & Habits",
    subtitle: "Daily quests · XP · Streaks",
  },
};

export function Header() {
  const pathname = usePathname();
  const page = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  );
  const { title, subtitle } = page?.[1] ?? {
    title: "SpendWise",
    subtitle: "",
  };

  return (
    <header className="flex h-16 items-center border-b border-border bg-background/80 px-8 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-semibold leading-none">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
