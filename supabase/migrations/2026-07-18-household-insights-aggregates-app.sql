-- App project: liability payment totals + user_id index.

CREATE OR REPLACE FUNCTION public.liability_payment_totals(p_user_id uuid)
RETURNS TABLE (
  liability_id uuid,
  paid_total numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    lp.liability_id,
    sum(lp.amount)::numeric AS paid_total
  FROM public.liability_payments lp
  WHERE lp.user_id = p_user_id
  GROUP BY lp.liability_id;
$$;

CREATE INDEX IF NOT EXISTS idx_liability_payments_user
  ON public.liability_payments (user_id);

GRANT EXECUTE ON FUNCTION public.liability_payment_totals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.liability_payment_totals(uuid) TO service_role;
