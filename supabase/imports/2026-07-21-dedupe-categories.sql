-- Merge user-scoped category duplicates into the matching global rows.
-- Occidente import inserts created Personal Care + Taxes under the user
-- even though global rows with the same name already existed.

BEGIN;

-- Personal Care: user 073c0acc… → global 3ec200f0…
UPDATE public.expenses
SET category_id = '3ec200f0-4d3a-4e6a-8eb8-416b55d3a531'
WHERE category_id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

UPDATE public.recurring_expenses
SET category_id = '3ec200f0-4d3a-4e6a-8eb8-416b55d3a531'
WHERE category_id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

UPDATE public.budgets
SET category_id = '3ec200f0-4d3a-4e6a-8eb8-416b55d3a531'
WHERE category_id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

UPDATE public.custom_budget_categories
SET category_id = '3ec200f0-4d3a-4e6a-8eb8-416b55d3a531'
WHERE category_id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

UPDATE public.categorization_rules
SET category_id = '3ec200f0-4d3a-4e6a-8eb8-416b55d3a531'
WHERE category_id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

DELETE FROM public.categories
WHERE id = '073c0acc-206d-41df-9d73-df7b3237e8b8';

-- Taxes: user 2fd76db4… → global d48ec116… (keep essential classification)
UPDATE public.expenses
SET category_id = 'd48ec116-5e2f-473d-9ab5-1430d427c373'
WHERE category_id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

UPDATE public.recurring_expenses
SET category_id = 'd48ec116-5e2f-473d-9ab5-1430d427c373'
WHERE category_id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

UPDATE public.budgets
SET category_id = 'd48ec116-5e2f-473d-9ab5-1430d427c373'
WHERE category_id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

UPDATE public.custom_budget_categories
SET category_id = 'd48ec116-5e2f-473d-9ab5-1430d427c373'
WHERE category_id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

UPDATE public.categorization_rules
SET category_id = 'd48ec116-5e2f-473d-9ab5-1430d427c373'
WHERE category_id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

DELETE FROM public.categories
WHERE id = '2fd76db4-d4a7-4cc0-adc3-42723dfe86fd';

COMMIT;

-- Sanity: no duplicate display names remaining for this user + globals
SELECT name, count(*) AS copies
FROM public.categories
WHERE user_id IS NULL OR user_id = 'a9e46715-ab7d-4ab9-8b8f-9b0fd6d67cf2'
GROUP BY name
HAVING count(*) > 1;
