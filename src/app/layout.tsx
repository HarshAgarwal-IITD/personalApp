import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "SpendWise — Expense Tracker",
  description:
    "Personal finance tracker with Telegram bot integration. Track expenses, manage budgets, and view analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} font-sans antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden pl-64">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
