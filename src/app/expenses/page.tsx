"use client";

import { useCallback, useEffect, useState } from "react";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { ExpenseCalendar } from "@/components/calendar/ExpenseCalendar";
import { ExpenseWithId, ALL_CATEGORIES, CATEGORY_LABELS } from "@/types";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Search, LayoutList, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "calendar";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "ALL") params.set("category", category);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/expenses?${params.toString()}`);
      setExpenses(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, category, startDate, endDate]);

  useEffect(() => {
    if (view === "list") {
      const t = setTimeout(fetchExpenses, 300);
      return () => clearTimeout(t);
    }
  }, [fetchExpenses, view]);

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const res = await fetch(`/api/export?${params.toString()}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "calendar"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
        </div>

        {/* List-only filters */}
        {view === "list" && (
          <>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="exp-search"
                placeholder="Search description…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "ALL")}>
              <SelectTrigger id="exp-cat-filter" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat as Category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="exp-start-date" type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input id="exp-end-date"   type="date" className="w-40" value={endDate}   onChange={(e) => setEndDate(e.target.value)}   />
          </>
        )}

        <div className="flex gap-2 ml-auto">
          <Button id="export-btn" variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
          <Button id="add-expense-btn" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Calendar view */}
      {view === "calendar" && <ExpenseCalendar />}

      {/* List view */}
      {view === "list" && (
        <>
          {!loading && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""} found
              </p>
              <p className="text-sm font-semibold">Total: ₹{total.toLocaleString("en-IN")}</p>
            </div>
          )}
          <ExpenseTable
            expenses={expenses}
            loading={loading}
            onDelete={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
            onEdit={(id, updated) =>
              setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)))
            }
          />
        </>
      )}

      {/* Add dialog */}
      <ExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={async (data) => {
          const res = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const newExpense = await res.json();
          setExpenses((prev) => [newExpense, ...prev]);
          setAddOpen(false);
        }}
      />
    </div>
  );
}
