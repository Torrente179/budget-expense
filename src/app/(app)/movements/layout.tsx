import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movements / Movimientos",
};

export default function MovementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
