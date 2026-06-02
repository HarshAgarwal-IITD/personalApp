export type Category = "FOOD" | "TRAVEL" | "RENT" | "AMENITIES" | "OTHERS";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type Expense = {
  id: string;
  amount: number;
  category: Category;
  description: string | null;
  date: Date;
  createdAt: Date;
};
export type ExpenseWithId = {
  id: string;
  amount: number;
  category: Category;
  description: string | null;
  date: Date | string;
  createdAt: Date | string;
};

export type BudgetWithId = {
  id: string;
  category: Category;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: Date | string;
};

export type BudgetWithUsage = BudgetWithId & {
  spent: number;
  remaining: number;
  percentage: number;
};

export type CategoryTotal = {
  category: Category;
  total: number;
};

export type DailyTotal = {
  date: string;
  total: number;
};

export type MonthlyTotal = {
  month: string;
  total: number;
};

export type AnalyticsData = {
  categoryBreakdown: CategoryTotal[];
  monthlyTotals: MonthlyTotal[];
  dailyTotals: DailyTotal[];
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
};

export const CATEGORY_COLORS: Record<Category, string> = {
  FOOD: "#f97316",
  TRAVEL: "#3b82f6",
  RENT: "#8b5cf6",
  AMENITIES: "#10b981",
  OTHERS: "#6b7280",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: "Food",
  TRAVEL: "Travel",
  RENT: "Rent",
  AMENITIES: "Amenities",
  OTHERS: "Others",
};

export const ALL_CATEGORIES: Category[] = [
  "FOOD",
  "TRAVEL",
  "RENT",
  "AMENITIES",
  "OTHERS",
];
