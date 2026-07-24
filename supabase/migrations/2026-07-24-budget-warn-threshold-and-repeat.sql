-- Per-budget warning threshold + monthly repeat, for the Crear presupuesto wizard.
--
-- warn_threshold : null → the default 75/90/100 alert ladder.
--                  50–99 → warn once at that %, then again at 100%.
-- repeats_monthly: whether "Copiar <mes>" carries this budget forward.
--                  Defaults true so existing budgets keep today's behaviour.

alter table public.custom_budgets
  add column if not exists warn_threshold integer,
  add column if not exists repeats_monthly boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custom_budgets_warn_threshold_check'
      and conrelid = 'public.custom_budgets'::regclass
  ) then
    alter table public.custom_budgets
      add constraint custom_budgets_warn_threshold_check
      check (warn_threshold is null or warn_threshold between 50 and 99);
  end if;
end $$;

-- Copy only budgets flagged to repeat, and carry the new settings across.
create or replace function public.copy_custom_budgets_from_previous_month(
  p_year integer,
  p_month integer
)
returns integer
language plpgsql
volatile
security invoker
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_target date;
  v_source date;
  v_budget record;
  v_budget_id uuid;
  v_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  v_target := make_date(p_year, p_month, 1);
  v_source := (v_target - interval '1 month')::date;

  for v_budget in
    select * from public.custom_budgets cb
    where cb.user_id = v_user_id
      and cb.year = extract(year from v_source)::integer
      and cb.month = extract(month from v_source)::integer
      and coalesce(cb.repeats_monthly, true)
  loop
    insert into public.custom_budgets (
      user_id, name, amount_type, amount_value, currency, month, year, kind,
      warn_threshold, repeats_monthly
    ) values (
      v_user_id, v_budget.name, v_budget.amount_type, v_budget.amount_value,
      v_budget.currency, p_month, p_year,
      coalesce(v_budget.kind, 'spending_limit'),
      v_budget.warn_threshold, coalesce(v_budget.repeats_monthly, true)
    )
    on conflict (user_id, name, month, year) do update set
      amount_type = excluded.amount_type,
      amount_value = excluded.amount_value,
      currency = excluded.currency,
      kind = excluded.kind,
      warn_threshold = excluded.warn_threshold,
      repeats_monthly = excluded.repeats_monthly,
      updated_at = now()
    returning id into v_budget_id;

    delete from public.custom_budget_categories
    where custom_budget_id = v_budget_id;
    insert into public.custom_budget_categories (custom_budget_id, category_id)
    select v_budget_id, cbc.category_id
    from public.custom_budget_categories cbc
    where cbc.custom_budget_id = v_budget.id
    on conflict do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.copy_custom_budgets_from_previous_month(integer, integer) from public;
grant execute on function public.copy_custom_budgets_from_previous_month(integer, integer) to authenticated;
