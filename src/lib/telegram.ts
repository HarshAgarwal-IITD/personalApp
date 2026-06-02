import { prisma } from "@/lib/prisma";
import { getCategoryLabel, parseExpenseMessage } from "@/lib/parser";
import { HABITS, HabitKey, computeXP, getRank } from "@/lib/habits";
import { computeHabitStreaks, computeOverallStreak } from "@/lib/streaks";
import { Telegraf, Context } from "telegraf";
import { Category, Expense } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID
  ? parseInt(process.env.ALLOWED_CHAT_ID, 10)
  : null;

function isAuthorized(ctx: Context): boolean {
  if (!ALLOWED_CHAT_ID) return true;
  return ctx.chat?.id === ALLOWED_CHAT_ID;
}

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// /start
bot.start((ctx) => {
  if (!isAuthorized(ctx)) return;
  ctx.reply(
    `👋 *Expense Tracker Bot*\n\n` +
      `Log expenses by sending:\n` +
      `\`<category> <amount> [description]\`\n\n` +
      `*Categories:* food, travel, rent, amenities, others\n\n` +
      `*Examples:*\n` +
      `\`food 300 momos\`\n` +
      `\`travel 120 uber\`\n` +
      `\`rent 12000 june rent\`\n\n` +
      `*Commands:*\n` +
      `/today — Today's expenses\n` +
      `/month — This month's summary\n` +
      `/food /travel /rent /amenities /others — Category total\n` +
      `/budget food 5000 — Set budget\n` +
      `/budgetstatus — Budget overview\n` +
      `/help — Show this message`,
    { parse_mode: "Markdown" }
  );
});

// /help
bot.help((ctx) => {
  if (!isAuthorized(ctx)) return;
  ctx.reply(
    `*Commands:*\n\n` +
      `/today — Today's expenses\n` +
      `/month — This month's summary\n` +
      `/food /travel /rent /amenities /others — Category total\n` +
      `/budget food 5000 — Set monthly budget\n` +
      `/budgetstatus — Budget overview\n\n` +
      `*Add Expense:*\n` +
      `\`<category> <amount> [description]\``,
    { parse_mode: "Markdown" }
  );
});

// /today
bot.command("today", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const now = new Date();
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      orderBy: { date: "desc" },
    });

    if (expenses.length === 0) {
      return ctx.reply("📭 No expenses today.");
    }

    const totals: Partial<Record<Category, number>> = {};
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }

    const grandTotal = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

    let msg = `📅 *Today's Expenses*\n\n`;
    for (const [cat, total] of Object.entries(totals)) {
      msg += `${getCategoryLabel(cat as Category)}: ${formatAmount(total!)}\n`;
    }
    msg += `\n*Total: ${formatAmount(grandTotal)}*`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to fetch today's expenses.");
  }
});

// /month
bot.command("month", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const now = new Date();
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      },
    });

    if (expenses.length === 0) {
      return ctx.reply("📭 No expenses this month.");
    }

    const totals: Partial<Record<Category, number>> = {};
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }

    const grandTotal = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
    const monthLabel = format(now, "MMMM yyyy");

    let msg = `📊 *${monthLabel}*\n\n`;
    for (const [cat, total] of Object.entries(totals)) {
      msg += `${getCategoryLabel(cat as Category)}: ${formatAmount(total!)}\n`;
    }
    msg += `\n*Total: ${formatAmount(grandTotal)}*`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to fetch monthly expenses.");
  }
});

// Category commands: /food, /travel, /rent, /amenities, /others
const categoryCommandMap: Record<string, Category> = {
  food: "FOOD",
  travel: "TRAVEL",
  rent: "RENT",
  amenities: "AMENITIES",
  others: "OTHERS",
};

for (const [command, category] of Object.entries(categoryCommandMap)) {
  bot.command(command, async (ctx) => {
    if (!isAuthorized(ctx)) return;
    try {
      const now = new Date();
      const expenses = await prisma.expense.findMany({
        where: {
          category,
          date: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
        },
      });

      const total = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);
      const monthLabel = format(now, "MMMM yyyy");

      ctx.reply(
        `📁 *${getCategoryLabel(category)} — ${monthLabel}*\n\n` +
          `Total: *${formatAmount(total)}*\n` +
          `Transactions: ${expenses.length}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      ctx.reply("❌ Failed to fetch category data.");
    }
  });
}

// /budget food 5000
bot.command("budget", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 2) {
    return ctx.reply(
      "❌ Usage: /budget <category> <amount>\nExample: /budget food 5000"
    );
  }

  const [rawCategory, rawAmount] = args;
  const categoryKey = rawCategory.toLowerCase();
  const category = categoryCommandMap[categoryKey];
  if (!category) {
    return ctx.reply(
      `❌ Unknown category: "${rawCategory}"\nValid: food, travel, rent, amenities, others`
    );
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply(`❌ Invalid amount: "${rawAmount}"`);
  }

  try {
    const now = new Date();
    await prisma.budget.upsert({
      where: {
        category_month_year: {
          category,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: { monthlyLimit: amount },
      create: {
        category,
        monthlyLimit: amount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });

    ctx.reply(
      `✅ *Budget Set*\n\n${getCategoryLabel(category)}: ${formatAmount(amount)}`,
      { parse_mode: "Markdown" }
    );
  } catch {
    ctx.reply("❌ Failed to set budget.");
  }
});

// /budgetstatus
bot.command("budgetstatus", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { month, year },
    });

    if (budgets.length === 0) {
      return ctx.reply(
        "📭 No budgets set. Use /budget food 5000 to set one."
      );
    }

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfMonth(now),
          lte: endOfMonth(now),
        },
      },
    });

    const spentMap: Partial<Record<Category, number>> = {};
    for (const e of expenses) {
      spentMap[e.category] = (spentMap[e.category] || 0) + e.amount;
    }

    let msg = `💰 *Budget Status — ${format(now, "MMMM yyyy")}*\n\n`;
    for (const b of budgets) {
      const spent = spentMap[b.category] || 0;
      const remaining = b.monthlyLimit - spent;
      const pct = Math.min(Math.round((spent / b.monthlyLimit) * 100), 100);
      const bar = remaining < 0 ? "🔴" : pct > 75 ? "🟡" : "🟢";

      msg +=
        `${bar} *${getCategoryLabel(b.category)}*\n` +
        `Limit: ${formatAmount(b.monthlyLimit)}\n` +
        `Spent: ${formatAmount(spent)}\n` +
        `Remaining: ${formatAmount(remaining)}\n\n`;
    }

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to fetch budget status.");
  }
});

// /xp — today's XP and rank
bot.command("xp", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const today = startOfDay(new Date());
    const log = await prisma.dailyLog.findUnique({ where: { date: today } });
    const habitValues = Object.fromEntries(
      (HABITS.map((h) => [h.key, log?.[h.key as HabitKey] ?? false]))
    ) as Record<HabitKey, boolean>;
    const xp = computeXP(habitValues);
    const rank = getRank(xp);
    const done = HABITS.filter((h) => log?.[h.key as HabitKey]).map((h) => h.emoji).join(" ");
    const remaining = HABITS.filter((h) => !log?.[h.key as HabitKey]).map((h) => `${h.emoji} ${h.label}`).join(", ");

    ctx.reply(
      `${rank.emoji} *${rank.label}* — ${xp}/100 XP\n\n` +
      (done ? `✅ Done: ${done}\n` : "") +
      (remaining ? `⏳ Remaining: ${remaining}` : "🎯 All habits done!"),
      { parse_mode: "Markdown" }
    );
  } catch {
    ctx.reply("❌ Failed to fetch XP.");
  }
});

// /streak — per-habit streaks
bot.command("streak", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const [habitStreaks, overall] = await Promise.all([
      computeHabitStreaks(),
      computeOverallStreak(),
    ]);

    let msg = `🔥 *Streak Report*\n\n`;
    msg += `Overall (≥50 XP/day): *${overall} days*\n\n`;
    for (const h of HABITS) {
      const s = habitStreaks[h.key as HabitKey] ?? 0;
      msg += `${h.emoji} ${h.label}: ${s > 0 ? `*${s} days*` : "—"}\n`;
    }

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to fetch streaks.");
  }
});

// /done <habit> — mark a habit as done today
// /done all — mark all done
bot.command("done", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  const args = ctx.message.text.split(/\s+/).slice(1).join(" ").toLowerCase().trim();

  if (!args) {
    return ctx.reply(
      "Usage: /done <habit>\nHabits: exercise, meditation, nof, reading, socialising, officework, learning\nOr: /done all"
    );
  }

  const habitKeyMap: Record<string, HabitKey> = {
    exercise: "exercise", gym: "exercise",
    meditation: "meditation", meditate: "meditation",
    nof: "nof", nofap: "nof",
    reading: "reading", read: "reading",
    socialising: "socialising", social: "socialising",
    officework: "officeWork", office: "officeWork", work: "officeWork",
    learning: "learning", learn: "learning",
  };

  try {
    const today = startOfDay(new Date());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};

    if (args === "all") {
      for (const h of HABITS) data[h.key] = true;
    } else {
      const key = habitKeyMap[args];
      if (!key) return ctx.reply(`❌ Unknown habit: "${args}"\nTry: exercise, meditation, nof, reading, socialising, officework, learning`);
      data[key] = true;
    }

    const existing = await prisma.dailyLog.findUnique({ where: { date: today } });
    const merged = Object.fromEntries(HABITS.map((h) => [h.key, existing?.[h.key as HabitKey] ?? false]));
    Object.assign(merged, data);
    const xp = computeXP(merged as Record<HabitKey, boolean>);
    const rank = getRank(xp);

    await prisma.dailyLog.upsert({
      where: { date: today },
      update: { ...data, xp },
      create: { date: today, ...data, xp },
    });

    const markedLabels = args === "all"
      ? "All habits"
      : HABITS.find((h) => h.key === habitKeyMap[args])?.label ?? args;

    ctx.reply(
      `✅ *${markedLabels} marked done!*\n\n${rank.emoji} ${rank.label} — ${xp}/100 XP`,
      { parse_mode: "Markdown" }
    );
  } catch {
    ctx.reply("❌ Failed to update habit.");
  }
});

// /todo <title> — add a task
bot.command("todo", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  const title = ctx.message.text.split(/\s+/).slice(1).join(" ").trim();
  if (!title) return ctx.reply("Usage: /todo <task title>\nExample: /todo Buy groceries");

  try {
    const task = await prisma.task.create({
      data: { title, priority: "MEDIUM" },
    });
    ctx.reply(`✅ *Task added*\n\n📝 ${task.title}`, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to add task.");
  }
});

// /todos — list pending tasks
bot.command("todos", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  try {
    const tasks = await prisma.task.findMany({
      where: { completed: false },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 15,
    });

    if (tasks.length === 0) return ctx.reply("🎉 No pending tasks!");

    const priorityEmoji: Record<string, string> = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };
    let msg = `📋 *Pending Tasks (${tasks.length})*\n\n`;
    tasks.forEach((t, i) => {
      msg += `${priorityEmoji[t.priority]} ${i + 1}. ${t.title}\n`;
    });
    msg += `\nUse /check <number> to complete a task.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to fetch tasks.");
  }
});

// /check <number> — complete task by list index
bot.command("check", async (ctx) => {
  if (!isAuthorized(ctx)) return;
  const num = parseInt(ctx.message.text.split(/\s+/)[1] ?? "", 10);
  if (isNaN(num) || num < 1) return ctx.reply("Usage: /check <number>\nUse /todos to see task numbers.");

  try {
    const tasks = await prisma.task.findMany({
      where: { completed: false },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 15,
    });

    const task = tasks[num - 1];
    if (!task) return ctx.reply(`❌ No task at position ${num}. Use /todos to see the list.`);

    await prisma.task.update({
      where: { id: task.id },
      data: { completed: true, completedAt: new Date() },
    });

    ctx.reply(`✅ *Completed:* ${task.title}`, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Failed to complete task.");
  }
});

// Natural message handler — expense entry
bot.on("text", async (ctx) => {
  if (!isAuthorized(ctx)) return;

  const text = ctx.message.text;
  if (text.startsWith("/")) return;

  const result = parseExpenseMessage(text);

  if (!result.success) {
    return ctx.reply(result.error);
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        amount: result.amount,
        category: result.category,
        description: result.description || null,
        date: new Date(),
      },
    });

    const label = getCategoryLabel(expense.category);
    const desc = expense.description ? `\n_${expense.description}_` : "";

    ctx.reply(
      `✅ *Expense Added*\n\n` +
        `${label}\n` +
        `*${formatAmount(expense.amount)}*` +
        desc,
      { parse_mode: "Markdown" }
    );
  } catch {
    ctx.reply("❌ Failed to save expense. Please try again.");
  }
});
