import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UpReviewHarness } from "@/components/design/up-review-harness";

export const metadata: Metadata = {
  title: "UP Design Review",
  robots: { index: false, follow: false, nocache: true },
};

export default function UpDesignReviewPage() {
  if (
    process.env.ENABLE_UP_DESIGN_REVIEW !== "true" ||
    process.env.VERCEL_ENV === "production"
  ) {
    notFound();
  }

  return <UpReviewHarness />;
}
