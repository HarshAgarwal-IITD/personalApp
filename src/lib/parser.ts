import { Category } from "@/types";

export type ParsedExpense = {
  success: true;
  category: Category;
  amount: number;
  description: string;
};

export type ParseError = {
  success: false;
  error: string;
};

const CATEGORY_MAP: Record<string, Category> = {
  food: "FOOD",
  travel: "TRAVEL",
  rent: "RENT",
  amenities: "AMENITIES",
  others: "OTHERS",
  other: "OTHERS",
};

export function parseExpenseMessage(
  message: string
): ParsedExpense | ParseError {
  const trimmed = message.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);

  if (parts.length < 2) {
    return {
      success: false,
      error:
        "❌ Invalid format. Use: <category> <amount> [description]\nExample: food 300 momos",
    };
  }

  const [rawCategory, rawAmount, ...descParts] = parts;

  const category = CATEGORY_MAP[rawCategory];
  if (!category) {
    const validCategories = Object.keys(CATEGORY_MAP)
      .filter((k) => k !== "other")
      .join(", ");
    return {
      success: false,
      error: `❌ Unknown category: "${rawCategory}"\nValid categories: ${validCategories}`,
    };
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    return {
      success: false,
      error: `❌ Invalid amount: "${rawAmount}". Must be a positive number.`,
    };
  }

  const description = descParts.join(" ");

  return {
    success: true,
    category,
    amount,
    description,
  };
}

export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    FOOD: "Food",
    TRAVEL: "Travel",
    RENT: "Rent",
    AMENITIES: "Amenities",
    OTHERS: "Others",
  };
  return labels[category];
}

export const VALID_CATEGORIES = Object.keys(CATEGORY_MAP).filter(
  (k) => k !== "other"
);
