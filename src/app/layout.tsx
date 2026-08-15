import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "@/providers/locale-provider";
import { Toaster } from "@/components/ui/sonner";
import { localeFromDeviceLanguages, resolveAppLocale } from "@/lib/locale";
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
  title: {
    default: "Budget & Expense",
    template: "%s — Budget & Expense",
  },
  description:
    "A private ledger for spending, budgets, and giving. / Tu libro privado de gastos, presupuestos y dar.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Budget & Expense",
    statusBarStyle: "black-translucent",
  },
};

/* One appearance — Up has no light/dark duality, so a single theme-color that
   matches the chrome band at the top of every screen. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1a1b23",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const explicitLocale = cookieStore.get("be_locale")?.value;
  const browserLocale = requestHeaders.get("accept-language")?.split(",")[0];
  const initialLocale = explicitLocale
    ? resolveAppLocale(explicitLocale)
    : localeFromDeviceLanguages(browserLocale);

  return (
    <html lang={initialLocale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={initialLocale}>
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
