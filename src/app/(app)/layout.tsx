"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NavRail } from "@/components/layout/nav-rail";
import { CaptureFab } from "@/components/capture/capture-fab";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { CurrencyProvider } from "@/providers/currency-provider";
import { MonthProvider } from "@/providers/month-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ProfileSheetProvider } from "@/components/layout/profile-sheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");

  return (
    <QueryProvider>
      <CurrencyProvider>
        <MonthProvider>
          <ProfileSheetProvider>
            <OnboardingGate>
            <div className="flex min-h-dvh overflow-hidden">
              {!isOnboarding && <Sidebar />}
              <div className="flex flex-1 flex-col overflow-hidden">
                {!isOnboarding && <Topbar />}
                {/* Up's rail is pinned above the scroll area, full-bleed —
                    so it sits outside main's gutters. */}
                {!isOnboarding && <NavRail />}
                <main
                  className={
                    isOnboarding
                      ? "flex-1 overflow-y-auto"
                      : "flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
                  }
                >
                  <div className="mx-auto w-full max-w-[1480px] px-4 pb-8 sm:px-5 lg:px-8">
                    {children}
                  </div>
                </main>
                {!isOnboarding && <CaptureFab />}
              </div>
            </div>
            </OnboardingGate>
          </ProfileSheetProvider>
        </MonthProvider>
      </CurrencyProvider>
    </QueryProvider>
  );
}
