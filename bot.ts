/**
 * bot.ts — Local development polling bot
 *
 * Run with: npx ts-node --project tsconfig.json bot.ts
 * Or add to package.json: "bot": "npx ts-node bot.ts"
 *
 * This uses long-polling so you don't need a public URL during development.
 * For production (Vercel), the webhook at /api/telegram is used instead.
 */

// We need to load env vars manually since this runs outside Next.js
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(__dirname, ".env.local") });

import { bot } from "./src/lib/telegram";

console.log("🤖 Bot starting in polling mode...");

bot.launch({
  allowedUpdates: ["message"],
}).then(() => {
  console.log("✅ Bot is running! Send a message in Telegram.");
  console.log("   Press Ctrl+C to stop.");
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
