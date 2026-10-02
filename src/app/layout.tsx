import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { cookies, headers } from "next/headers";
import { LocaleProvider } from "@/providers/locale-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { localeFromDeviceLanguages, resolveAppLocale } from "@/lib/locale";
import {
  THEME_COOKIE_KEY,
  THEME_GROUND,
  resolveThemePreference,
} from "@/lib/theme";
import "./globals.css";

/** Card Stream's one typeface. Mapped to the font tokens in globals.css. */
const manrope = Manrope({
  variable: "--font-manrope",
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

/* The browser chrome takes the page ground: fixed for an explicit Light or
   Dark choice, per device scheme for "Match device". */
export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  const preference = resolveThemePreference(
    cookieStore.get(THEME_COOKIE_KEY)?.value
  );
  return {
    viewportFit: "cover",
    themeColor:
      preference === "system"
        ? [
            {
              media: "(prefers-color-scheme: light)",
              color: THEME_GROUND.light,
            },
            { media: "(prefers-color-scheme: dark)", color: THEME_GROUND.dark },
          ]
        : THEME_GROUND[preference],
  };
}

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
  const themePreference = resolveThemePreference(
    cookieStore.get(THEME_COOKIE_KEY)?.value
  );

  return (
    <html
      lang={initialLocale}
      data-theme={themePreference}
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialPreference={themePreference}>
          <LocaleProvider initialLocale={initialLocale}>
            {children}
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
