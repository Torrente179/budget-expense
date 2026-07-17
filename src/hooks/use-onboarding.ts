"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isPrimaryGoal, type PrimaryGoal } from "@/lib/onboarding/goals";
import { queryKeys } from "@/lib/query/keys";

export interface OnboardingProfile {
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
  wants_budget_help: boolean | null;
  primary_goals: PrimaryGoal[];
  /** Profile row created_at — used to grandfather pre-feature accounts. */
  created_at: string | null;
}

/** Users whose profile existed before this date are never force-gated. */
export const ONBOARDING_FEATURE_LAUNCH = "2026-07-18T00:00:00.000Z";

const DISMISS_SESSION_KEY = "be-onboarding-dismissed";

function normalizeGoals(raw: unknown): PrimaryGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PrimaryGoal =>
      typeof item === "string" && isPrimaryGoal(item)
  );
}

function emptyProfile(): OnboardingProfile {
  return {
    onboarding_completed_at: null,
    onboarding_skipped_at: null,
    wants_budget_help: null,
    primary_goals: [],
    created_at: null,
  };
}

export function markOnboardingDismissedInSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
  } catch {
    /* ignore */
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

async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed_at, onboarding_skipped_at, wants_budget_help, primary_goals, created_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Columns may be missing until migration is applied — do not force wizard.
    return {
      ...emptyProfile(),
      onboarding_skipped_at: new Date().toISOString(),
      created_at: user.created_at ?? null,
    };
  }

  if (!data) {
    return {
      ...emptyProfile(),
      created_at: user.created_at ?? null,
    };
  }

  return {
    onboarding_completed_at: data.onboarding_completed_at ?? null,
    onboarding_skipped_at: data.onboarding_skipped_at ?? null,
    wants_budget_help: data.wants_budget_help ?? null,
    primary_goals: normalizeGoals(data.primary_goals),
    created_at: data.created_at ?? user.created_at ?? null,
  };
}

export function useOnboarding() {
  const queryClient = useQueryClient();

  const {
    data: profile = null,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.onboardingProfile,
    queryFn: fetchOnboardingProfile,
    staleTime: 30_000,
  });

  const dismissedInSession = isOnboardingDismissedInSession();

  const settled =
    Boolean(profile?.onboarding_completed_at) ||
    Boolean(profile?.onboarding_skipped_at) ||
    dismissedInSession;

  /** Force redirect only for brand-new accounts that have not finished/skipped. */
  const needsOnboarding =
    !loading &&
    profile !== null &&
    !settled &&
    isNewUserForOnboarding(profile);

  /** Resume CTAs for new users who skipped or never finished — not a force-gate. */
  const incomplete =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed_at &&
    isNewUserForOnboarding(profile);

  const skipOnboarding = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const skippedAt = new Date().toISOString();

    // Optimistic dismiss first so OnboardingGate cannot bounce to /onboarding.
    markOnboardingDismissedInSession();
    queryClient.setQueryData<OnboardingProfile | null>(
      queryKeys.onboardingProfile,
      (previous) =>
        previous
          ? { ...previous, onboarding_skipped_at: skippedAt }
          : { ...emptyProfile(), onboarding_skipped_at: skippedAt }
    );

    const { data, error } = await supabase
      .from("profiles")
      .update({ onboarding_skipped_at: skippedAt })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Profile not found — cannot skip onboarding");
    }
  }, [queryClient]);

  const completeOnboarding = useCallback(
    async (input: { wantsBudgetHelp: boolean; goals: PrimaryGoal[] }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const completedAt = new Date().toISOString();
      markOnboardingDismissedInSession();
      queryClient.setQueryData<OnboardingProfile | null>(
        queryKeys.onboardingProfile,
        (previous) =>
          previous
            ? {
                ...previous,
                wants_budget_help: input.wantsBudgetHelp,
                primary_goals: input.goals,
                onboarding_completed_at: completedAt,
                onboarding_skipped_at: null,
              }
            : {
                ...emptyProfile(),
                wants_budget_help: input.wantsBudgetHelp,
                primary_goals: input.goals,
                onboarding_completed_at: completedAt,
              }
      );

      const { error } = await supabase
        .from("profiles")
        .update({
          wants_budget_help: input.wantsBudgetHelp,
          primary_goals: input.goals,
          onboarding_completed_at: completedAt,
          onboarding_skipped_at: null,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    [queryClient]
  );

  return {
    profile,
    loading,
    needsOnboarding,
    incomplete,
    refetch: () => refetch(),
    skipOnboarding,
    completeOnboarding,
  };
}
