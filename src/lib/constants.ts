import { PALETTE } from "@/lib/palette";

export const CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "\u20ac", flag: "\ud83c\uddea\ud83c\uddfa" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "\ud83c\uddfa\ud83c\uddf8" },
  { code: "GBP", name: "British Pound", symbol: "\u00a3", flag: "\ud83c\uddec\ud83c\udde7" },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "\ud83c\udde8\ud83c\uddf4" },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00a5", flag: "\ud83c\uddef\ud83c\uddf5" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "\ud83c\udde8\ud83c\udded" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "\ud83c\udde8\ud83c\udde6" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "\ud83c\udde6\ud83c\uddfa" },
  { code: "CNY", name: "Chinese Yuan", symbol: "\u00a5", flag: "\ud83c\udde8\ud83c\uddf3" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "\ud83c\uddf2\ud83c\uddfd" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "\ud83c\udde7\ud83c\uddf7" },
  { code: "KRW", name: "South Korean Won", symbol: "\u20a9", flag: "\ud83c\uddf0\ud83c\uddf7" },
  { code: "INR", name: "Indian Rupee", symbol: "\u20b9", flag: "\ud83c\uddee\ud83c\uddf3" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "\ud83c\uddf8\ud83c\uddea" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "\ud83c\uddf3\ud83c\uddf4" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "\ud83c\udde9\ud83c\uddf0" },
  { code: "PLN", name: "Polish Zloty", symbol: "z\u0142", flag: "\ud83c\uddf5\ud83c\uddf1" },
  { code: "TRY", name: "Turkish Lira", symbol: "\u20ba", flag: "\ud83c\uddf9\ud83c\uddf7" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "\ud83c\uddf3\ud83c\uddff" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "\ud83c\uddf8\ud83c\uddec" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "utensils-crossed", color: PALETTE.categories.restaurants },
  { name: "Transportation", icon: "car-front", color: PALETTE.categories.transportation },
  { name: "Housing", icon: "home", color: PALETTE.categories.housing },
  { name: "Utilities", icon: "zap", color: PALETTE.categories.services },
  { name: "Entertainment", icon: "clapperboard", color: PALETTE.categories.entertainment },
  { name: "Shopping", icon: "shopping-bag", color: PALETTE.categories.shopping },
  { name: "Healthcare", icon: "stethoscope", color: PALETTE.categories.health },
  { name: "Education", icon: "graduation-cap", color: PALETTE.categories.education },
  { name: "Travel", icon: "plane-takeoff", color: PALETTE.categories.travel },
  { name: "Subscriptions", icon: "monitor-play", color: PALETTE.categories.subscriptions },
  { name: "Groceries", icon: "shopping-cart", color: PALETTE.categories.groceries },
  { name: "Other", icon: "circle-ellipsis", color: PALETTE.categories.other },
  { name: "Loan", icon: "banknote", color: PALETTE.categories.loan },
] as const;

const CATEGORY_LOCALIZATIONS = [
  { en: "Food & Dining", es: "Alimentación y Restaurantes" },
  { en: "Transportation", es: "Transporte" },
  { en: "Housing", es: "Vivienda" },
  { en: "Utilities", es: "Servicios" },
  { en: "Entertainment", es: "Entretenimiento" },
  { en: "Shopping", es: "Compras" },
  { en: "Healthcare", es: "Salud" },
  { en: "Education", es: "Educación" },
  { en: "Travel", es: "Viajes" },
  { en: "Subscriptions", es: "Suscripciones" },
  { en: "Groceries", es: "Supermercado" },
  { en: "Other", es: "Otros" },
  { en: "Loan", es: "Préstamo" },
  { en: "Salary", es: "Nómina" },
  { en: "Other Income", es: "Otros ingresos" },
  { en: "Taxes", es: "Impuestos" },
  { en: "Professional Services", es: "Servicios Profesionales" },
  { en: "Donations", es: "Donaciones" },
  { en: "Personal Care", es: "Cuidado Personal" },
  { en: "Tithe", es: "Diezmo", aliases: ["Tithe / Diezmo"] },
  { en: "Insurance", es: "Seguros" },
  { en: "Cash", es: "Efectivo" },
  { en: "Savings", es: "Ahorro" },
  { en: "Investments", es: "Inversiones" },
] as const satisfies ReadonlyArray<{
  en: string;
  es: string;
  aliases?: readonly string[];
}>;

function normalizeCategoryKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const CATEGORY_TRANSLATION_INDEX = CATEGORY_LOCALIZATIONS.reduce<
  Record<string, { en: string; es: string }>
>((acc, category) => {
  const aliases = "aliases" in category ? category.aliases : [];
  for (const key of [category.en, category.es, ...aliases]) {
    acc[normalizeCategoryKey(key)] = { en: category.en, es: category.es };
  }
  return acc;
}, {});

export const CATEGORY_TRANSLATIONS: Record<string, string> = Object.fromEntries(
  CATEGORY_LOCALIZATIONS.map((category) => [category.en, category.es])
);

export function translateCategoryName(name: string, locale: string): string {
  const translation = CATEGORY_TRANSLATION_INDEX[normalizeCategoryKey(name)];
  if (!translation) return name;
  return locale === "es" ? translation.es : translation.en;
}
