"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TabBar } from "@/components/layout/tab-bar";
import { CaptureProvider } from "@/components/capture/capture-button";
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
            <CaptureProvider>
              <OnboardingGate>
                <div className="flex min-h-dvh overflow-hidden bg-background">
                  {!isOnboarding && <Sidebar />}
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <main
                      className={
                        isOnboarding
                          ? "flex-1 overflow-y-auto"
                          : "flex-1 overflow-y-auto pb-[calc(6.25rem+env(safe-area-inset-bottom))] md:pb-0"
                      }
                    >
                      <div className="mx-auto w-full max-w-[1480px] px-4 pb-8 sm:px-5 lg:px-8">
                        {children}
                      </div>
                    </main>
                    {!isOnboarding && <TabBar />}
                  </div>
                </div>
              </OnboardingGate>
            </CaptureProvider>
          </ProfileSheetProvider>
        </MonthProvider>
      </CurrencyProvider>
    </QueryProvider>
  );
}
