-- Include custom_budgets.kind in prepare_month_snapshot so Home/Budget
-- can separate spending_limit (Presupuestos) from contribution_goal (Metas).

create or replace function public.prepare_month_snapshot(
  p_year integer,
  p_month integer,
  p_as_of date default current_date
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_start date;
  v_end date;
  v_previous_start date;
  v_period_end date;
  v_balance_target date;
  v_checkpoint public.balance_checkpoints%rowtype;
  v_inserted_count integer := 0;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_year not between 2020 and 2100 or p_month not between 1 and 12 then
    raise exception 'Invalid month' using errcode = '22023';
  end if;

  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + interval '1 month')::date;
  v_previous_start := (v_start - interval '1 month')::date;
  v_period_end := v_end - 1;
  v_balance_target := least(p_as_of, v_period_end);

  with inserted as (
    insert into public.expenses (
      user_id,
      category_id,
      recurring_expense_id,
      recurring_month,
      amount,
      currency,
      description,
      date,
      source_kind
    )
    select
      v_user_id,
      r.category_id,
      r.id,
      v_start,
      r.amount,
      r.currency,
      r.description,
      make_date(
        p_year,
        p_month,
        least(
          r.charge_day,
          extract(day from (v_end - 1))::integer
        )
      ),
      'recurring'
    from public.recurring_expenses r
    where r.user_id = v_user_id
      and r.is_active = true
      and r.start_date < v_end
    on conflict (user_id, recurring_expense_id, recurring_month) do nothing
    returning 1
  )
  select count(*) into v_inserted_count from inserted;

  if v_start <= p_as_of then
    select bc.*
    into v_checkpoint
    from public.balance_checkpoints bc
    where bc.user_id = v_user_id
      and bc.as_of_date <= v_balance_target
    order by bc.as_of_date desc, bc.created_at desc
    limit 1;
  end if;

  select jsonb_build_object(
    'period', jsonb_build_object(
      'year', p_year,
      'month', p_month,
      'startDate', v_start,
      'endDate', v_end,
      'asOfDate', p_as_of
    ),
    'recurringInsertedCount', v_inserted_count,
    'expenseCount', (
      select count(*) from public.expenses e
      where e.user_id = v_user_id and e.date >= v_start and e.date < v_end
    ),
    'currencyTotals', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.currency)
      from (
        select
          m.currency,
          coalesce(sum(m.amount) filter (where m.kind = 'expense'), 0)::numeric as "totalSpent",
          coalesce(sum(m.amount) filter (where m.kind = 'income'), 0)::numeric as "totalIncome",
          coalesce(sum(m.amount) filter (where m.kind = 'investment'), 0)::numeric as "totalInvestmentTransfers",
          coalesce(sum(m.amount) filter (where m.kind = 'previous_expense'), 0)::numeric as "previousSpent",
          coalesce(sum(m.amount) filter (where m.kind = 'previous_investment'), 0)::numeric as "previousInvestmentTransfers",
          coalesce(sum(m.amount) filter (where m.kind = 'giving'), 0)::numeric as "givingSpent",
          coalesce(sum(m.amount) filter (where m.kind = 'mtd_expense'), 0)::numeric as "monthToDateSpent",
          coalesce(sum(m.amount) filter (where m.kind = 'mtd_income'), 0)::numeric as "monthToDateIncome",
          coalesce(sum(m.amount) filter (where m.kind = 'mtd_investment'), 0)::numeric as "monthToDateInvestmentTransfers"
        from (
          select e.currency, e.amount, 'expense'::text as kind
          from public.expenses e
          where e.user_id = v_user_id and e.date >= v_start and e.date < v_end
          union all
          select i.currency, i.amount, 'income'
          from public.income_entries i
          where i.user_id = v_user_id and i.date >= v_start and i.date < v_end
          union all
          select t.currency, t.amount, 'investment'
          from public.investment_savings_transfers t
          where t.user_id = v_user_id and t.transfer_date >= v_start and t.transfer_date < v_end
          union all
          select e.currency, e.amount, 'previous_expense'
          from public.expenses e
          where e.user_id = v_user_id and e.date >= v_previous_start and e.date < v_start
          union all
          select t.currency, t.amount, 'previous_investment'
          from public.investment_savings_transfers t
          where t.user_id = v_user_id and t.transfer_date >= v_previous_start and t.transfer_date < v_start
          union all
          select e.currency, e.amount, 'giving'
          from public.expenses e
          left join public.categories c on c.id = e.category_id
          where e.user_id = v_user_id
            and e.date >= v_start and e.date < v_end
            and (
              c.classification = 'giving'
              or lower(coalesce(c.name, '')) ~ '(tithe|diezmo|giving|donaci|charity|caridad|offering|ofrenda|church|iglesia|generos)'
              or lower(coalesce(e.description, '')) ~ '(tithe|diezmo|giving|donaci|charity|caridad|offering|ofrenda|church|iglesia|generos)'
            )
          union all
          select e.currency, e.amount, 'mtd_expense'
          from public.expenses e
          where e.user_id = v_user_id and e.date >= v_start and e.date <= least(p_as_of, v_period_end)
          union all
          select i.currency, i.amount, 'mtd_income'
          from public.income_entries i
          where i.user_id = v_user_id and i.date >= v_start and i.date <= least(p_as_of, v_period_end)
          union all
          select t.currency, t.amount, 'mtd_investment'
          from public.investment_savings_transfers t
          where t.user_id = v_user_id and t.transfer_date >= v_start and t.transfer_date <= least(p_as_of, v_period_end)
        ) m
        group by m.currency
      ) t
    ), '[]'::jsonb),
    'categoryAggregates', coalesce((
      select jsonb_agg(to_jsonb(ca) order by ca."totalAmount" desc)
      from (
        select
          e.category_id as "categoryId",
          coalesce(c.name, '—') as "categoryName",
          coalesce(c.color, '#64748b') as "categoryColor",
          coalesce(c.icon, 'circle') as "categoryIcon",
          c.classification,
          e.currency,
          sum(e.amount)::numeric as "totalAmount",
          count(*)::bigint as "expenseCount"
        from public.expenses e
        left join public.categories c on c.id = e.category_id
        where e.user_id = v_user_id and e.date >= v_start and e.date < v_end
        group by e.category_id, c.name, c.color, c.icon, c.classification, e.currency
      ) ca
    ), '[]'::jsonb),
    'dailyAggregates', coalesce((
      select jsonb_agg(to_jsonb(da) order by da.date)
      from (
        select x.date, x.currency, sum(x.amount)::numeric as amount
        from (
          select e.date, e.currency, e.amount
          from public.expenses e
          where e.user_id = v_user_id and e.date >= v_start and e.date < v_end
          union all
          select t.transfer_date, t.currency, t.amount
          from public.investment_savings_transfers t
          where t.user_id = v_user_id and t.transfer_date >= v_start and t.transfer_date < v_end
        ) x
        group by x.date, x.currency
      ) da
    ), '[]'::jsonb),
    'recentMovements', coalesce((
      select jsonb_agg(to_jsonb(rm) order by rm.date desc, rm."createdAt" desc)
      from (
        select * from (
          select
            e.id,
            'expense'::text as kind,
            coalesce(e.description, c.name, '—') as title,
            coalesce(c.name, '—') as subtitle,
            e.amount,
            e.currency,
            e.date,
            e.created_at as "createdAt",
            e.needs_review as "needsReview",
            case when c.id is null then null else jsonb_build_object('icon', c.icon, 'color', c.color) end as category
          from public.expenses e
          left join public.categories c on c.id = e.category_id
          where e.user_id = v_user_id and e.date >= v_start and e.date < v_end
          union all
          select
            i.id,
            'income'::text,
            i.source,
            coalesce(i.description, 'Income'),
            i.amount,
            i.currency,
            i.date,
            i.created_at,
            i.needs_review,
            null::jsonb
          from public.income_entries i
          where i.user_id = v_user_id and i.date >= v_start and i.date < v_end
        ) all_movements
        order by date desc, "createdAt" desc
        limit 12
      ) rm
    ), '[]'::jsonb),
    'budgets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'categoryId', b.category_id,
        'amount', b.amount,
        'currency', b.currency
      ) order by b.created_at)
      from public.budgets b
      where b.user_id = v_user_id and b.year = p_year and b.month = p_month
    ), '[]'::jsonb),
    'monthlyPlan', (
      select jsonb_build_object(
        'id', p.id,
        'incomeAmount', p.income_amount,
        'incomeCurrency', p.income_currency,
        'allocationPercent', p.allocation_percent
      )
      from public.monthly_budget_plans p
      where p.user_id = v_user_id and p.year = p_year and p.month = p_month
      limit 1
    ),
    'customBudgets', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', cb.id,
          'user_id', cb.user_id,
          'name', cb.name,
          'kind', cb.kind,
          'amount_type', cb.amount_type,
          'amount_value', cb.amount_value,
          'currency', cb.currency,
          'month', cb.month,
          'year', cb.year,
          'created_at', cb.created_at,
          'updated_at', cb.updated_at,
          'custom_budget_categories', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', cbc.id,
              'category_id', cbc.category_id,
              'categories', to_jsonb(c)
            ))
            from public.custom_budget_categories cbc
            join public.categories c on c.id = cbc.category_id
            where cbc.custom_budget_id = cb.id
          ), '[]'::jsonb)
        ) order by cb.created_at
      )
      from public.custom_budgets cb
      where cb.user_id = v_user_id and cb.year = p_year and cb.month = p_month
    ), '[]'::jsonb),
    'recurringExpenses', coalesce((
      select jsonb_agg(
        to_jsonb(r) || jsonb_build_object(
          'categories', case when c.id is null then null else to_jsonb(c) end
        )
        order by r.charge_day, r.created_at
      )
      from public.recurring_expenses r
      left join public.categories c on c.id = r.category_id
      where r.user_id = v_user_id and r.is_active = true
    ), '[]'::jsonb),
    'balance', jsonb_build_object(
      'status', case
        when v_start > p_as_of then 'future'
        when v_checkpoint.id is null then 'untracked'
        else 'tracked'
      end,
      'asOfDate', case when v_checkpoint.id is null then null else v_balance_target end,
      'checkpoint', case when v_checkpoint.id is null then null else jsonb_build_object(
        'balance', v_checkpoint.balance,
        'currency', v_checkpoint.currency,
        'as_of_date', v_checkpoint.as_of_date,
        'created_at', v_checkpoint.created_at,
        'calculated_balance_before', v_checkpoint.calculated_balance_before,
        'reconciliation_delta', v_checkpoint.reconciliation_delta,
        'calculation_start_date', v_checkpoint.calculation_start_date,
        'calculation_basis', v_checkpoint.calculation_basis
      ) end,
      'movementTotals', case when v_checkpoint.id is null then jsonb_build_object(
        'incomes', '[]'::jsonb,
        'expenses', '[]'::jsonb,
        'investmentTransfers', '[]'::jsonb
      ) else jsonb_build_object(
        'incomes', coalesce((
          select jsonb_agg(jsonb_build_object('currency', q.currency, 'amount', q.amount))
          from (
            select i.currency, sum(i.amount)::numeric as amount
            from public.income_entries i
            where i.user_id = v_user_id and i.date <= v_balance_target
              and (i.date > v_checkpoint.as_of_date or (i.date = v_checkpoint.as_of_date and i.created_at > v_checkpoint.created_at))
            group by i.currency
          ) q
        ), '[]'::jsonb),
        'expenses', coalesce((
          select jsonb_agg(jsonb_build_object('currency', q.currency, 'amount', q.amount))
          from (
            select e.currency, sum(e.amount)::numeric as amount
            from public.expenses e
            where e.user_id = v_user_id and e.date <= v_balance_target
              and (e.date > v_checkpoint.as_of_date or (e.date = v_checkpoint.as_of_date and e.created_at > v_checkpoint.created_at))
            group by e.currency
          ) q
        ), '[]'::jsonb),
        'investmentTransfers', coalesce((
          select jsonb_agg(jsonb_build_object('currency', q.currency, 'amount', q.amount))
          from (
            select t.currency, sum(t.amount)::numeric as amount
            from public.investment_savings_transfers t
            where t.user_id = v_user_id and t.transfer_date <= v_balance_target
              and (t.transfer_date > v_checkpoint.as_of_date or (t.transfer_date = v_checkpoint.as_of_date and t.created_at > v_checkpoint.created_at))
            group by t.currency
          ) q
        ), '[]'::jsonb)
      ) end
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_household_insights()
returns jsonb
language sql
stable
security invoker
set search_path = public, auth
as $$
  with bounds as (
    select date_trunc('month', current_date)::date - interval '11 months' as start_date
  ),
  expense_rows as (
    select
      to_char(date_trunc('month', e.date), 'YYYY-MM') as month,
      e.category_id,
      coalesce(c.name, '—') as category_name,
      case
        when c.classification in ('giving', 'essential', 'savings') then c.classification
        when lower(coalesce(c.name, '')) ~ '(tithe|diezmo|giving|donaci|charity|caridad|offering|ofrenda|church|iglesia|generos)' then 'giving'
        else 'discretionary'
      end as bucket,
      e.currency,
      sum(e.amount)::numeric as total,
      count(*)::bigint as count
    from public.expenses e
    left join public.categories c on c.id = e.category_id
    cross join bounds b
    where e.user_id = auth.uid() and e.date >= b.start_date
    group by 1, 2, 3, 4, 5
  ),
  income_rows as (
    select
      to_char(date_trunc('month', i.date), 'YYYY-MM') as month,
      i.currency,
      sum(i.amount)::numeric as total
    from public.income_entries i
    cross join bounds b
    where i.user_id = auth.uid() and i.date >= b.start_date
    group by 1, 2
  )
  select jsonb_build_object(
    'startMonth', to_char(b.start_date, 'YYYY-MM'),
    'expenses', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select month, bucket, currency, sum(total)::numeric as total, sum(count)::bigint as count
        from expense_rows group by month, bucket, currency
      ) x
    ), '[]'::jsonb),
    'incomes', coalesce((select jsonb_agg(to_jsonb(i)) from income_rows i), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'month', e.month,
        'categoryId', e.category_id,
        'categoryName', e.category_name,
        'currency', e.currency,
        'total', e.total,
        'count', e.count
      )) from expense_rows e
    ), '[]'::jsonb),
    'liabilities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'name', l.name,
        'kind', l.kind,
        'currency', l.currency,
        'original_balance', l.original_balance,
        'interest_rate_percent', l.interest_rate_percent,
        'is_active', l.is_active,
        'paid_total', coalesce((
          select sum(lp.amount) from public.liability_payments lp
          where lp.user_id = auth.uid() and lp.liability_id = l.id
        ), 0)
      ))
      from public.liabilities l
      where l.user_id = auth.uid()
    ), '[]'::jsonb),
    'titheTargetPercent', coalesce((
      select p.tithe_target_percent from public.profiles p where p.id = auth.uid()
    ), 10),
    'settingsAvailable', true
  )
  from bounds b
  where auth.uid() is not null;
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
    select v_budget_id, value::text::uuid
    from jsonb_array_elements(coalesce(v_budget -> 'category_ids', '[]'::jsonb))
    on conflict do nothing;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.create_expense_with_envelope_status(
  p_category_id uuid,
  p_amount numeric,
  p_currency text,
  p_date date,
  p_description text default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_expense public.expenses%rowtype;
  v_expense_json jsonb;
  v_budgets jsonb;
  v_expense_totals jsonb;
  v_plan jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_amount <= 0 or p_currency !~ '^[A-Za-z]{3}$' then
    raise exception 'Invalid expense amount or currency' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.categories c
    where c.id = p_category_id and (c.user_id is null or c.user_id = v_user_id)
  ) then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  insert into public.expenses (
    user_id, category_id, amount, currency, description, date, source_kind
  ) values (
    v_user_id,
    p_category_id,
    p_amount,
    upper(p_currency),
    nullif(trim(p_description), ''),
    p_date,
    'manual'
  )
  returning * into v_expense;

  select to_jsonb(v_expense) || jsonb_build_object('categories', to_jsonb(c))
  into v_expense_json
  from public.categories c
  where c.id = v_expense.category_id
    and (c.user_id is null or c.user_id = v_user_id);

  select coalesce(jsonb_agg(
    to_jsonb(cb) || jsonb_build_object(
      'custom_budget_categories', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', cbc.id,
            'category_id', cbc.category_id,
            'categories', to_jsonb(c)
          ) order by c.name
        )
        from public.custom_budget_categories cbc
        join public.categories c on c.id = cbc.category_id
        where cbc.custom_budget_id = cb.id
      ), '[]'::jsonb)
    ) order by cb.name
  ), '[]'::jsonb)
  into v_budgets
  from public.custom_budgets cb
  where cb.user_id = v_user_id
    and cb.year = extract(year from p_date)::integer
    and cb.month = extract(month from p_date)::integer
    and exists (
      select 1
      from public.custom_budget_categories affected
      where affected.custom_budget_id = cb.id
        and affected.category_id = p_category_id
    );

  select coalesce(jsonb_agg(to_jsonb(grouped)), '[]'::jsonb)
  into v_expense_totals
  from (
    select
      min(e.id::text) as id,
      e.category_id,
      sum(e.amount)::numeric as amount,
      e.currency,
      min(e.date)::date as date
    from public.expenses e
    where e.user_id = v_user_id
      and e.date >= date_trunc('month', p_date)::date
      and e.date < (date_trunc('month', p_date) + interval '1 month')::date
      and exists (
        select 1
        from public.custom_budget_categories cbc
        join public.custom_budgets cb on cb.id = cbc.custom_budget_id
        where cb.user_id = v_user_id
          and cb.year = extract(year from p_date)::integer
          and cb.month = extract(month from p_date)::integer
          and cbc.category_id = e.category_id
          and exists (
            select 1
            from public.custom_budget_categories affected
            where affected.custom_budget_id = cb.id
              and affected.category_id = p_category_id
          )
      )
    group by e.category_id, e.currency
  ) grouped;

  select to_jsonb(p)
  into v_plan
  from public.monthly_budget_plans p
  where p.user_id = v_user_id
    and p.year = extract(year from p_date)::integer
    and p.month = extract(month from p_date)::integer;

  return jsonb_build_object(
    'expense', v_expense_json,
    'envelopeContext', jsonb_build_object(
      'budgets', v_budgets,
      'expenses', v_expense_totals,
      'plan', v_plan
    )
  );
end;
$$;

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
      user_id, name, amount_type, amount_value, currency, month, year
    ) values (
      v_user_id, v_budget.name, v_budget.amount_type, v_budget.amount_value,
      v_budget.currency, p_month, p_year
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
    select v_budget_id, cbc.category_id
    from public.custom_budget_categories cbc
    where cbc.custom_budget_id = v_budget.id
    on conflict do nothing;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.copy_category_budgets_from_previous_month(
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
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  v_target := make_date(p_year, p_month, 1);
  v_source := (v_target - interval '1 month')::date;

  with copied as (
    insert into public.budgets (
      user_id, category_id, amount, currency, month, year
    )
    select
      v_user_id, b.category_id, b.amount, b.currency, p_month, p_year
    from public.budgets b
    where b.user_id = v_user_id
      and b.year = extract(year from v_source)::integer
      and b.month = extract(month from v_source)::integer
    on conflict (user_id, category_id, month, year) do update set
      amount = excluded.amount,
      currency = excluded.currency,
      updated_at = now()
    returning 1
  )
  select count(*) into v_count from copied;
  return v_count;
end;
$$;

revoke all on function public.get_app_bootstrap() from public;

