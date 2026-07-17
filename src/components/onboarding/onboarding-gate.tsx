"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isOnboardingDismissedInSession,
  useOnboarding,
} from "@/hooks/use-onboarding";

const ALLOWED_WHILE_PENDING = ["/onboarding", "/settings", "/login", "/signup"];

/**
 * Soft client gate: only brand-new accounts that have not completed or skipped
 * onboarding are steered to /onboarding. Pre-feature accounts are never forced.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, needsOnboarding } = useOnboarding();

  useEffect(() => {
    if (loading) return;
    if (isOnboardingDismissedInSession()) return;
    if (!needsOnboarding) return;

    const allowed = ALLOWED_WHILE_PENDING.some((path) =>
      pathname.startsWith(path)
    );
    if (!allowed) {
      router.replace("/onboarding");
    }
  }, [loading, needsOnboarding, pathname, router]);

  return <>{children}</>;
}
