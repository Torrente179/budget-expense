"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isPrimaryGoal, type PrimaryGoal } from "@/lib/onboarding/goals";
import { queryKeys } from "@/lib/query/keys";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import type { AppBootstrap } from "@/lib/data";

export interface OnboardingProfile {
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
  wants_budget_help: boolean | null;
  primary_goals: PrimaryGoal[];
  created_at: string | null;
}

export const ONBOARDING_FEATURE_LAUNCH = "2026-07-18T00:00:00.000Z";
const DISMISS_SESSION_KEY = "be-onboarding-dismissed";

function normalizeGoals(raw: unknown): PrimaryGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PrimaryGoal =>
      typeof item === "string" && isPrimaryGoal(item)
  );
}

export function markOnboardingDismissedInSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
  } catch {
    // Session storage is optional.
  }
}

export function isOnboardingDismissedInSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DISMISS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function isNewUserForOnboarding(profile: OnboardingProfile): boolean {
  if (!profile.created_at) return true;
  return (
    new Date(profile.created_at).getTime() >=
    new Date(ONBOARDING_FEATURE_LAUNCH).getTime()
  );
}

function updateBootstrapProfile(
  queryClient: ReturnType<typeof useQueryClient>,
  update: Partial<AppBootstrap["profile"]>
) {
  queryClient.setQueryData<AppBootstrap>(queryKeys.appBootstrap, (previous) =>
    previous
      ? { ...previous, profile: { ...previous.profile, ...update } }
      : previous
  );
}

export function useOnboarding() {
  const queryClient = useQueryClient();
  const bootstrap = useAppBootstrap();
  const source = bootstrap.data?.profile;
  const profile: OnboardingProfile | null = source
    ? {
        onboarding_completed_at: source.onboardingCompletedAt,
        onboarding_skipped_at: source.onboardingSkippedAt,
        wants_budget_help: source.wantsBudgetHelp,
        primary_goals: normalizeGoals(source.primaryGoals),
        created_at: source.createdAt,
      }
    : null;
  const loading = bootstrap.isPending;
  const dismissedInSession = isOnboardingDismissedInSession();
  const settled =
    Boolean(profile?.onboarding_completed_at) ||
    Boolean(profile?.onboarding_skipped_at) ||
    dismissedInSession;
  const needsOnboarding =
    !loading &&
    profile !== null &&
    !settled &&
    isNewUserForOnboarding(profile);
  const incomplete =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed_at &&
    isNewUserForOnboarding(profile);

  const skipOnboarding = useCallback(async () => {
    const userId = bootstrap.data?.identity.id;
    if (!userId) throw new Error("Not signed in");
    const skippedAt = new Date().toISOString();
    markOnboardingDismissedInSession();
    updateBootstrapProfile(queryClient, { onboardingSkippedAt: skippedAt });
    const { data, error } = await createClient()
      .from("profiles")
      .update({ onboarding_skipped_at: skippedAt })
      .eq("id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Profile not found — cannot skip onboarding");
  }, [bootstrap.data?.identity.id, queryClient]);

  const completeOnboarding = useCallback(
    async (input: { wantsBudgetHelp: boolean; goals: PrimaryGoal[] }) => {
      const userId = bootstrap.data?.identity.id;
      if (!userId) throw new Error("Not signed in");
      const completedAt = new Date().toISOString();
      markOnboardingDismissedInSession();
      updateBootstrapProfile(queryClient, {
        wantsBudgetHelp: input.wantsBudgetHelp,
        primaryGoals: input.goals,
        onboardingCompletedAt: completedAt,
        onboardingSkippedAt: null,
      });
      const { error } = await createClient()
        .from("profiles")
        .update({
          wants_budget_help: input.wantsBudgetHelp,
          primary_goals: input.goals,
          onboarding_completed_at: completedAt,
          onboarding_skipped_at: null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    [bootstrap.data?.identity.id, queryClient]
  );

  return {
    profile,
    loading,
    needsOnboarding,
    incomplete,
    refetch: bootstrap.refetch,
    skipOnboarding,
    completeOnboarding,
  };
}
