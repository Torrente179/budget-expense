import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights / Análisis",
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
