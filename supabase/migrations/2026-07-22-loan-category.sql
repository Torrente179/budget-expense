-- ============================================
-- Global "Loan" expense category (money lent to others).
-- Apply to BOTH Supabase projects (categories are mirrored).
-- ============================================

INSERT INTO public.categories (user_id, name, icon, color, is_default, classification)
SELECT NULL, 'Loan', 'banknote', '#0f766e', true, 'savings'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.categories
    WHERE user_id IS NULL
      AND lower(btrim(name)) = 'loan'
);

-- Retag if a prior insert landed with old icon / discretionary classification.
UPDATE public.categories
SET classification = 'savings',
    icon = 'banknote',
    color = COALESCE(NULLIF(btrim(color), ''), '#0f766e'),
    is_default = true
WHERE user_id IS NULL
  AND lower(btrim(name)) = 'loan'
  AND (
    classification IS DISTINCT FROM 'savings'
    OR icon IS DISTINCT FROM 'banknote'
    OR color IS DISTINCT FROM '#0f766e'
    OR is_default IS DISTINCT FROM true
  );
