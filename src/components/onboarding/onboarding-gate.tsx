"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/use-onboarding";

const ALLOWED_WHILE_PENDING = ["/onboarding", "/settings", "/login", "/signup"];

/**
 * Soft client gate: incomplete onboarding users are steered to /onboarding
 * unless they already skipped/completed or are on allowed routes.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, needsOnboarding } = useOnboarding();

  useEffect(() => {
    if (loading || !needsOnboarding) return;
    const allowed = ALLOWED_WHILE_PENDING.some((path) =>
      pathname.startsWith(path)
    );
    if (!allowed) {
      router.replace("/onboarding");
    }
  }, [loading, needsOnboarding, pathname, router]);

  return <>{children}</>;
}
