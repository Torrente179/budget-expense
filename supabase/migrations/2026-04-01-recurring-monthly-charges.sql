-- Recurring monthly charges
-- Safe to run on an existing database.

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    description TEXT,
    charge_day INTEGER NOT NULL CHECK (charge_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_active
    ON public.recurring_expenses(user_id, is_active, charge_day);

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS recurring_expense_id UUID,
    ADD COLUMN IF NOT EXISTS recurring_month DATE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'expenses_recurring_expense_id_fkey'
    ) THEN
        ALTER TABLE public.expenses
            ADD CONSTRAINT expenses_recurring_expense_id_fkey
            FOREIGN KEY (recurring_expense_id)
            REFERENCES public.recurring_expenses(id)
            ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_recurring_month_unique
    ON public.expenses(user_id, recurring_expense_id, recurring_month);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_updated_at_recurring_expenses'
    ) THEN
        CREATE TRIGGER set_updated_at_recurring_expenses
            BEFORE UPDATE ON public.recurring_expenses
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
    END IF;
END;
$$;

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can insert own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can update own recurring expenses" ON public.recurring_expenses;
DROP POLICY IF EXISTS "Users can delete own recurring expenses" ON public.recurring_expenses;

CREATE POLICY "Users can view own recurring expenses"
    ON public.recurring_expenses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own recurring expenses"
    ON public.recurring_expenses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own recurring expenses"
    ON public.recurring_expenses FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own recurring expenses"
    ON public.recurring_expenses FOR DELETE USING (user_id = auth.uid());
