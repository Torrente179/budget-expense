import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LocaleProvider } from "@/providers/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/**
 * STAND-IN for Up's typeface, which is unconfirmed — Brandfetch returns 403
 * and Up's design blog never names it. From the captures it is a tight
 * geometric sans with heavy, negatively-tracked numerals; Inter is the closest
 * freely-available match. Swap here and in globals.css when identified.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Budget & Expense",
  title: "Budget & Expense",
  description:
    "A private ledger for spending, budgets, and giving. / Tu libro privado de gastos, presupuestos y dar.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Budget & Expense",
    statusBarStyle: "default",
  },
};

/* One appearance — Up has no light/dark duality, so a single theme-color that
   matches the chrome band at the top of every screen. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1a1b23",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale="en">
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
