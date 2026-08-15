import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget / Presupuesto",
};

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
