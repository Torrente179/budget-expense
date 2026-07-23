-- Budget roles: fine-grained tags so budgeting methods know which
-- envelope each category belongs to. Keeps stewardship `classification`.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS budget_role text;

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_budget_role_check;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_budget_role_check
  CHECK (
    budget_role IS NULL
    OR budget_role IN (
      'housing',
      'utilities',
      'groceries',
      'transport',
      'healthcare',
      'insurance',
      'taxes',
      'dining',
      'shopping',
      'subscriptions',
      'entertainment',
      'travel',
      'personal_care',
      'education',
      'professional',
      'cash',
      'other',
      'tithe',
      'donations',
      'savings',
      'investments',
      'loan_lent',
      'income',
      'debt_payment'
    )
  );

-- Seed / retag existing categories by name (case-insensitive).
UPDATE public.categories SET budget_role = v.role
FROM (
  VALUES
    ('housing', 'housing'),
    ('utilities', 'utilities'),
    ('groceries', 'groceries'),
    ('transportation', 'transport'),
    ('healthcare', 'healthcare'),
    ('taxes', 'taxes'),
    ('food & dining', 'dining'),
    ('shopping', 'shopping'),
    ('subscriptions', 'subscriptions'),
    ('entertainment', 'entertainment'),
    ('travel', 'travel'),
    ('personal care', 'personal_care'),
    ('education', 'education'),
    ('professional services', 'professional'),
    ('other', 'other'),
    ('tithe / diezmo', 'tithe'),
    ('tithe', 'tithe'),
    ('diezmo', 'tithe'),
    ('donations', 'donations'),
    ('loan', 'loan_lent'),
    ('salary', 'income'),
    ('other income', 'income'),
    ('insurance', 'insurance'),
    ('seguros', 'insurance'),
    ('cash', 'cash'),
    ('atm', 'cash'),
    ('savings', 'savings'),
    ('ahorro', 'savings'),
    ('investments', 'investments'),
    ('inversiones', 'investments')
) AS v(name, role)
WHERE lower(btrim(categories.name)) = v.name
  AND categories.budget_role IS DISTINCT FROM v.role;

-- Fallback for anything still null.
UPDATE public.categories
SET budget_role = CASE classification
  WHEN 'essential' THEN 'other'
  WHEN 'giving' THEN 'donations'
  WHEN 'savings' THEN 'savings'
  ELSE 'other'
END
WHERE budget_role IS NULL;

ALTER TABLE public.categories
  ALTER COLUMN budget_role SET DEFAULT 'other';

ALTER TABLE public.categories
  ALTER COLUMN budget_role SET NOT NULL;

-- New default categories for method envelopes + insurance/cash splits.
INSERT INTO public.categories (
  user_id, name, icon, color, is_default, classification, applies_to, budget_role
)
SELECT NULL, 'Insurance', 'shield', '#0EA5E9', true, 'essential', 'expense', 'insurance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE user_id IS NULL AND lower(btrim(name)) = 'insurance'
);

INSERT INTO public.categories (
  user_id, name, icon, color, is_default, classification, applies_to, budget_role
)
SELECT NULL, 'Cash', 'banknote', '#64748B', true, 'discretionary', 'expense', 'cash'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE user_id IS NULL AND lower(btrim(name)) = 'cash'
);

INSERT INTO public.categories (
  user_id, name, icon, color, is_default, classification, applies_to, budget_role
)
SELECT NULL, 'Savings', 'piggy-bank', '#10B981', true, 'savings', 'expense', 'savings'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE user_id IS NULL AND lower(btrim(name)) IN ('savings', 'ahorro')
);

INSERT INTO public.categories (
  user_id, name, icon, color, is_default, classification, applies_to, budget_role
)
SELECT NULL, 'Investments', 'trending-up', '#6366F1', true, 'savings', 'expense', 'investments'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories
  WHERE user_id IS NULL AND lower(btrim(name)) IN ('investments', 'inversiones')
);

-- Ensure Loan stays loan_lent + savings classification (money lent).
UPDATE public.categories
SET budget_role = 'loan_lent',
    classification = 'savings',
    applies_to = COALESCE(applies_to, 'both')
WHERE user_id IS NULL
  AND lower(btrim(name)) = 'loan';
