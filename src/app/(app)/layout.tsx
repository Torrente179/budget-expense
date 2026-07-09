"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { QuickAddFab } from "@/components/expenses/quick-add-fab";
import { CurrencyProvider } from "@/providers/currency-provider";
import { QueryProvider } from "@/providers/query-provider";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <QueryProvider>
      <CurrencyProvider>
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-[1480px] p-4 sm:p-5 lg:p-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
          <MobileBottomNav />
          <QuickAddFab />
        </div>
      </div>
      </CurrencyProvider>
    </QueryProvider>
  );
}
