-- Dual budget engines: spending limits vs contribution goals.
-- Home/Budget treat these with different status logic (ceiling vs floor).

alter table public.custom_budgets
  add column if not exists kind text not null default 'spending_limit';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custom_budgets_kind_check'
      and conrelid = 'public.custom_budgets'::regclass
  ) then
    alter table public.custom_budgets
      add constraint custom_budgets_kind_check
      check (kind in ('spending_limit', 'contribution_goal'));
  end if;
end $$;

-- Backfill: envelopes whose categories are all giving/savings/investment roles → goals.
update public.custom_budgets cb
set kind = 'contribution_goal'
where cb.kind = 'spending_limit'
  and exists (
    select 1
    from public.custom_budget_categories cbc
    where cbc.custom_budget_id = cb.id
  )
  and not exists (
    select 1
    from public.custom_budget_categories cbc
    join public.categories c on c.id = cbc.category_id
    where cbc.custom_budget_id = cb.id
      and coalesce(c.classification, '') not in ('giving', 'savings')
      and coalesce(c.budget_role, '') not in (
        'tithe', 'donations', 'savings', 'investments'
      )
  );

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
  loop
    insert into public.custom_budgets (
      user_id, name, amount_type, amount_value, currency, month, year, kind
    ) values (
      v_user_id, v_budget.name, v_budget.amount_type, v_budget.amount_value,
      v_budget.currency, p_month, p_year, coalesce(v_budget.kind, 'spending_limit')
    )
    on conflict (user_id, name, month, year) do update set
      amount_type = excluded.amount_type,
      amount_value = excluded.amount_value,
      currency = excluded.currency,
      kind = excluded.kind,
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

create or replace function public.replace_custom_budget_set(
  p_year integer,
  p_month integer,
  p_budgets jsonb,
  p_replace_existing boolean default false
)
returns integer
language plpgsql
volatile
security invoker
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_budget jsonb;
  v_budget_id uuid;
  v_count integer := 0;
  v_kind text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_year not between 2020 and 2100 or p_month not between 1 and 12 then
    raise exception 'Invalid month' using errcode = '22023';
  end if;
  if jsonb_typeof(p_budgets) <> 'array' then
    raise exception 'Budgets must be an array' using errcode = '22023';
  end if;

  if p_replace_existing then
    delete from public.custom_budgets
    where user_id = v_user_id and year = p_year and month = p_month;
  end if;

  for v_budget in select value from jsonb_array_elements(p_budgets)
  loop
    v_kind := coalesce(nullif(trim(v_budget ->> 'kind'), ''), 'spending_limit');
    if v_kind not in ('spending_limit', 'contribution_goal') then
      v_kind := 'spending_limit';
    end if;

    insert into public.custom_budgets (
      user_id, name, amount_type, amount_value, currency, month, year, kind
    ) values (
      v_user_id,
      trim(v_budget ->> 'name'),
      v_budget ->> 'amount_type',
      (v_budget ->> 'amount_value')::numeric,
      upper(v_budget ->> 'currency'),
      p_month,
      p_year,
      v_kind
    )
    on conflict (user_id, name, month, year) do update set
      amount_type = excluded.amount_type,
      amount_value = excluded.amount_value,
      currency = excluded.currency,
      kind = excluded.kind,
      updated_at = now()
    returning id into v_budget_id;

    delete from public.custom_budget_categories
    where custom_budget_id = v_budget_id;

    insert into public.custom_budget_categories (custom_budget_id, category_id)
    select v_budget_id, trim(category_id)::uuid
    from jsonb_array_elements_text(
      coalesce(v_budget -> 'category_ids', '[]'::jsonb)
    ) as t(category_id)
    where nullif(trim(category_id), '') is not null
    on conflict do nothing;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.copy_custom_budgets_from_previous_month(integer, integer) from public;
grant execute on function public.copy_custom_budgets_from_previous_month(integer, integer) to authenticated;
revoke all on function public.replace_custom_budget_set(integer, integer, jsonb, boolean) from public;
grant execute on function public.replace_custom_budget_set(integer, integer, jsonb, boolean) to authenticated;

notify pgrst, 'reload schema';
