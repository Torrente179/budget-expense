"use client";

import { useLinkStatus } from "next/link";

export function NavigationPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={
        pending
          ? "nav-pending-indicator is-pending"
          : "nav-pending-indicator"
      }
    />
  );
}
