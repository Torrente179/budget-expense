-- Run against a staging/local copy after applying the performance migration.
-- Everything is wrapped in a transaction and rolled back; production data is
-- never modified permanently by this validation.

begin;

do $$
declare
  v_user_a uuid;
  v_user_b uuid;
  v_month date;
  v_snapshot jsonb;
  v_expected numeric;
  v_actual numeric;
  v_other_visible bigint;
  v_other_updated bigint;
  v_category_id uuid;
  v_expense_count_before bigint;
  v_expense_write jsonb;
begin
  select id into v_user_a from auth.users order by created_at limit 1;
  select id into v_user_b from auth.users where id <> v_user_a order by created_at limit 1;

  if v_user_a is null then
    raise notice 'SKIP: no auth user is available for contract validation';
    return;
  end if;

  perform set_config('request.jwt.claim.sub', v_user_a::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text,
    true
  );

  if (public.get_app_bootstrap() -> 'identity' ->> 'id')::uuid <> v_user_a then
    raise exception 'Bootstrap identity does not match auth.uid()';
  end if;

  for v_month in
    select distinct date_trunc('month', e.date)::date
    from public.expenses e
    where e.user_id = v_user_a
    order by 1 desc
    limit 6
  loop
    v_snapshot := public.prepare_month_snapshot(
      extract(year from v_month)::integer,
      extract(month from v_month)::integer,
      current_date
    );

    select coalesce(sum(e.amount), 0)
    into v_expected
    from public.expenses e
    where e.user_id = v_user_a
      and e.date >= v_month
      and e.date < (v_month + interval '1 month')::date
      and e.currency = 'EUR';

    select coalesce(sum((item ->> 'totalSpent')::numeric), 0)
    into v_actual
    from jsonb_array_elements(v_snapshot -> 'currencyTotals') item
    where item ->> 'currency' = 'EUR';

    if v_actual <> v_expected then
      raise exception 'Snapshot parity failure for %, expected %, got %',
        v_month, v_expected, v_actual;
    end if;
  end loop;

  if exists (
    select 1
    from public.expenses e
    where e.user_id = v_user_a
      and e.recurring_expense_id is not null
      and e.recurring_month is not null
    group by e.user_id, e.recurring_expense_id, e.recurring_month
    having count(*) > 1
  ) then
    raise exception 'Recurring materialization produced duplicates';
  end if;

  select c.id into v_category_id
  from public.categories c
  where c.user_id = v_user_a or c.user_id is null
  order by c.user_id nulls last, c.created_at
  limit 1;
  if v_category_id is not null then
    select count(*) into v_expense_count_before
    from public.expenses e where e.user_id = v_user_a;
    v_expense_write := public.create_expense_with_envelope_status(
      v_category_id,
      1.00,
      'EUR',
      current_date,
      'transaction rollback validation'
    );
    if v_expense_write -> 'expense' ->> 'id' is null then
      raise exception 'Transactional expense did not return the inserted row';
    end if;
    if (select count(*) from public.expenses e where e.user_id = v_user_a)
      <> v_expense_count_before + 1 then
      raise exception 'Transactional expense inserted an unexpected row count';
    end if;
  end if;

  if v_user_b is not null then
    execute 'set local role authenticated';
    select count(*) into v_other_visible
    from public.expenses e
    where e.user_id = v_user_b;
    if v_other_visible <> 0 then
      raise exception 'RLS isolation failure: user A can see user B expenses';
    end if;
    update public.expenses
    set description = description
    where user_id = v_user_b;
    get diagnostics v_other_updated = row_count;
    if v_other_updated <> 0 then
      raise exception 'RLS isolation failure: user A can mutate user B expenses';
    end if;
    execute 'reset role';
  end if;
end;
$$;

rollback;
