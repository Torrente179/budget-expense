"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TabBar } from "@/components/layout/tab-bar";
import { CaptureFab } from "@/components/capture/capture-fab";
import { CurrencyProvider } from "@/providers/currency-provider";
import { MonthProvider } from "@/providers/month-provider";
import { QueryProvider } from "@/providers/query-provider";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <QueryProvider>
      <CurrencyProvider>
        <MonthProvider>
          <div className="flex min-h-dvh overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
                <AnimatePresence mode="wait">
                  {/* Opacity-only transition: transforms would break the
                      sticky screen headers inside. */}
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="mx-auto w-full max-w-[1480px] px-4 pb-8 sm:px-5 lg:px-8"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </main>
              <TabBar />
              <CaptureFab />
            </div>
          </div>
        </MonthProvider>
      </CurrencyProvider>
    </QueryProvider>
  );
}
