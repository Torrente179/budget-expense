import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Budget & Expense",
    short_name: "Budget Expense",
    description:
      "Track expenses and monthly stewardship plans / Registra gastos y planes mensuales de mayordomía.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#2d3135",
    theme_color: "#2d3135",
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
