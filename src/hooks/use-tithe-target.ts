"use client";

import { useAppBootstrap } from "@/hooks/use-app-bootstrap";

/**
 * The user's giving target (% of income) from profiles.tithe_target_percent.
 * Falls back to the biblical 10% benchmark when unset or before the
 * 2026-07-03 migration is applied.
 */
export function useTitheTarget() {
  const { data } = useAppBootstrap();
  return Number(data?.profile.titheTargetPercent ?? 10);
}
