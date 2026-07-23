-- Fix category_ids cast in replace_custom_budget_set.
-- jsonb_array_elements()::text includes JSON quotes, so ::uuid failed and
-- method seeding returned an error after the browser confirm.

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
    insert into public.custom_budgets (
      user_id, name, amount_type, amount_value, currency, month, year
    ) values (
      v_user_id,
      trim(v_budget ->> 'name'),
      v_budget ->> 'amount_type',
      (v_budget ->> 'amount_value')::numeric,
      upper(v_budget ->> 'currency'),
      p_month,
      p_year
    )
    on conflict (user_id, name, month, year) do update set
      amount_type = excluded.amount_type,
      amount_value = excluded.amount_value,
      currency = excluded.currency,
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

revoke all on function public.replace_custom_budget_set(integer, integer, jsonb, boolean) from public;
grant execute on function public.replace_custom_budget_set(integer, integer, jsonb, boolean) to authenticated;
