import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget & Expense",
    short_name: "Budget Expense",
    description:
      "A private ledger for spending, budgets, and giving. / Tu libro privado de gastos, presupuestos y dar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1A1B23",
    theme_color: "#1A1B23",
    icons: [
      {
        src: "/icons/budget-expense-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/budget-expense-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
