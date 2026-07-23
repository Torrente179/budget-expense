-- High-confidence recategorization from existing descriptions.
-- Requires Insurance / Cash categories from 2026-07-24-category-budget-roles.sql.

UPDATE public.expenses e
SET category_id = c_ins.id
FROM public.categories c_ins
WHERE c_ins.user_id IS NULL
  AND lower(btrim(c_ins.name)) = 'insurance'
  AND (
    lower(coalesce(e.description, '')) LIKE '%generali%'
    OR lower(coalesce(e.description, '')) LIKE '%mutua madrilena%'
    OR lower(coalesce(e.description, '')) LIKE '%mutua madrileña%'
  );

UPDATE public.expenses e
SET category_id = c_cash.id
FROM public.categories c_cash
WHERE c_cash.user_id IS NULL
  AND lower(btrim(c_cash.name)) = 'cash'
  AND (
    lower(coalesce(e.description, '')) LIKE '%retirada de efectivo%'
    OR lower(coalesce(e.description, '')) LIKE '%reintegro contra cuenta%'
    OR lower(coalesce(e.description, '')) LIKE '%cajero automatico%'
    OR lower(coalesce(e.description, '')) LIKE '%cajero automático%'
    OR lower(coalesce(e.description, '')) ~ 'atm[[:space:]]'
  );
