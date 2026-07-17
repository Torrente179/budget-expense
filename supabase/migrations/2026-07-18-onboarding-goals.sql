-- New-user onboarding + financial goals on profiles (app project).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS wants_budget_help boolean,
  ADD COLUMN IF NOT EXISTS primary_goals text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'When the user finished the first-run setup wizard';
COMMENT ON COLUMN public.profiles.onboarding_skipped_at IS
  'When the user skipped onboarding; app remains usable';
COMMENT ON COLUMN public.profiles.wants_budget_help IS
  'Whether the user asked for budgeting help during onboarding';
COMMENT ON COLUMN public.profiles.primary_goals IS
  'Financial goal keys: save_more, increase_wealth, budget_tracking, decrease_expenses, pay_debt, give_generously, build_emergency_fund';
