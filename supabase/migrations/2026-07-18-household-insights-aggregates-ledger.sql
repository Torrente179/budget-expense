-- Ledger project: SQL aggregates for trailing household insights.

CREATE OR REPLACE FUNCTION public.household_expense_category_aggregates(
  p_user_id uuid,
  p_start_date date
)
RETURNS TABLE (
  month text,
  category_id uuid,
  category_name text,
  classification text,
  currency text,
  total numeric,
  expense_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', e.date), 'YYYY-MM') AS month,
    e.category_id,
    coalesce(c.name, '—') AS category_name,
    c.classification AS classification,
    e.currency,
    sum(e.amount)::numeric AS total,
    count(*)::bigint AS expense_count
  FROM public.expenses e
  LEFT JOIN public.categories c ON c.id = e.category_id
  WHERE e.user_id = p_user_id
    AND e.date >= p_start_date
  GROUP BY 1, 2, 3, 4, 5;
$$;

CREATE OR REPLACE FUNCTION public.household_income_aggregates(
  p_user_id uuid,
  p_start_date date
)
RETURNS TABLE (
  month text,
  currency text,
  total numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    to_char(date_trunc('month', i.date), 'YYYY-MM') AS month,
    i.currency,
    sum(i.amount)::numeric AS total
  FROM public.income_entries i
  WHERE i.user_id = p_user_id
    AND i.date >= p_start_date
  GROUP BY 1, 2;
$$;

GRANT EXECUTE ON FUNCTION public.household_expense_category_aggregates(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.household_income_aggregates(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.household_expense_category_aggregates(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.household_income_aggregates(uuid, date) TO service_role;
