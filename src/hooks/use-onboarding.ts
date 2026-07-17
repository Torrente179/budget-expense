"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPrimaryGoal, type PrimaryGoal } from "@/lib/onboarding/goals";

export interface OnboardingProfile {
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
  wants_budget_help: boolean | null;
  primary_goals: PrimaryGoal[];
}

function normalizeGoals(raw: unknown): PrimaryGoal[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is PrimaryGoal => typeof item === "string" && isPrimaryGoal(item));
}

export function useOnboarding() {
  const supabase = createClient();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "onboarding_completed_at, onboarding_skipped_at, wants_budget_help, primary_goals"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        // Columns may be missing until migration is applied.
        setProfile({
          onboarding_completed_at: null,
          onboarding_skipped_at: null,
          wants_budget_help: null,
          primary_goals: [],
        });
        return;
      }

      setProfile({
        onboarding_completed_at: data?.onboarding_completed_at ?? null,
        onboarding_skipped_at: data?.onboarding_skipped_at ?? null,
        wants_budget_help: data?.wants_budget_help ?? null,
        primary_goals: normalizeGoals(data?.primary_goals),
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const needsOnboarding =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed_at &&
    !profile.onboarding_skipped_at;

  const incomplete =
    !loading &&
    profile !== null &&
    !profile.onboarding_completed_at;

  async function skipOnboarding() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ onboarding_skipped_at: new Date().toISOString() })
      .eq("id", user.id);
    await refetch();
  }

  async function completeOnboarding(input: {
    wantsBudgetHelp: boolean;
    goals: PrimaryGoal[];
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        wants_budget_help: input.wantsBudgetHelp,
        primary_goals: input.goals,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_skipped_at: null,
      })
      .eq("id", user.id);
    await refetch();
  }

  return {
    profile,
    loading,
    needsOnboarding,
    incomplete,
    refetch,
    skipOnboarding,
    completeOnboarding,
  };
}
