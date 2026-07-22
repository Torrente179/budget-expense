"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface TotalNavIconProps {
  className?: string;
}

export function TotalNavIcon({ className }: TotalNavIconProps) {
  return (
    <span className={cn("relative inline-flex h-4 w-4 items-center justify-center", className)}>
      <ArrowUpRight className="absolute -right-0.5 -top-0.5 h-3 w-3" />
      <ArrowDownLeft className="absolute -bottom-0.5 -left-0.5 h-3 w-3" />
    </span>
  );
}
