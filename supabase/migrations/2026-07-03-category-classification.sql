-- ============================================
-- Category classification: essential / discretionary / giving / savings
-- Apply to BOTH Supabase projects (categories are mirrored with identical
-- UUIDs across the ledger and app projects).
-- ============================================

ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'discretionary';

DO $$ BEGIN
    ALTER TABLE public.categories
        ADD CONSTRAINT categories_classification_check
        CHECK (classification IN ('essential', 'discretionary', 'giving', 'savings'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Seed sensible defaults by name (EN + ES naming schemes both covered).
-- Users can retag anything from Settings; unmatched names stay discretionary.
UPDATE public.categories SET classification = 'essential'
WHERE classification = 'discretionary'
  AND (
    name ILIKE '%housing%' OR name ILIKE '%vivienda%' OR name ILIKE '%rent%' OR name ILIKE '%alquiler%'
    OR name ILIKE '%utilit%' OR name ILIKE '%servicios%' OR name ILIKE '%suministros%'
    OR name ILIKE '%grocer%' OR name ILIKE '%mercado%' OR name ILIKE '%supermercado%'
    OR name ILIKE '%health%' OR name ILIKE '%salud%' OR name ILIKE '%medic%'
    OR name ILIKE '%transport%' OR name ILIKE '%transporte%'
    OR name ILIKE '%tax%' OR name ILIKE '%impuesto%'
    OR name ILIKE '%insurance%' OR name ILIKE '%seguro%'
  );

UPDATE public.categories SET classification = 'giving'
WHERE classification = 'discretionary'
  AND (
    name ILIKE '%tithe%' OR name ILIKE '%diezmo%'
    OR name ILIKE '%giving%' OR name ILIKE '%generosidad%'
    OR name ILIKE '%donation%' OR name ILIKE '%donaci%'
    OR name ILIKE '%offering%' OR name ILIKE '%ofrenda%'
    OR name ILIKE '%charity%' OR name ILIKE '%caridad%'
    OR name ILIKE '%church%' OR name ILIKE '%iglesia%'
  );
