import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

/**
 * `/` is the product's only public page.
 *
 * Signed-in visitors never see it — they go straight to the app, which is what
 * `/` did unconditionally before this page existed. Signed-out visitors get the
 * tour instead of being bounced to a login form with no explanation of what
 * they would be logging into. The proxy has a matching exception for `/`; see
 * `lib/supabase/middleware.ts`.
 */
export const metadata: Metadata = {
  title: {
    absolute: "Budget & Expense — Money, clearly",
  },
  description:
    "A private ledger for spending, budgets, savings goals and everything you own. Bilingual EN/ES, multi-currency. / Un libro privado de gastos, presupuestos, metas de ahorro y todo lo que tienes.",
  openGraph: {
    title: "Budget & Expense — Money, clearly",
    description:
      "Four screens. The whole month. A private ledger for spending, budgets, savings goals and everything you own.",
    type: "website",
  },
};

export default async function RootPage() {
  let signedIn = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  } catch {
    // Supabase unconfigured (local checkout without env). The landing page is
    // static, so it is still the right thing to serve.
  }

  // Outside the try: `redirect` signals by throwing, and a catch would swallow
  // it and render the landing page to someone who is already signed in.
  if (signedIn) {
    redirect("/home");
  }

  return <LandingPage />;
}
