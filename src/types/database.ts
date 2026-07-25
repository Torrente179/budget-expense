export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      balance_checkpoints: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          as_of_date: string;
          calculated_balance_before: number | null;
          reconciliation_delta: number | null;
          calculation_start_date: string | null;
          calculation_basis: "monthly_net" | "tracked_balance" | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance: number;
          currency: string;
          as_of_date: string;
          calculated_balance_before?: number | null;
          reconciliation_delta?: number | null;
          calculation_start_date?: string | null;
          calculation_basis?: "monthly_net" | "tracked_balance" | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          currency?: string;
          as_of_date?: string;
          calculated_balance_before?: number | null;
          reconciliation_delta?: number | null;
          calculation_start_date?: string | null;
          calculation_basis?: "monthly_net" | "tracked_balance" | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          base_currency: string;
          tithe_target_percent: number;
          manual_fx_rates: Json | null;
          onboarding_completed_at: string | null;
          onboarding_skipped_at: string | null;
          wants_budget_help: boolean | null;
          primary_goals: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          base_currency?: string;
          tithe_target_percent?: number;
          manual_fx_rates?: Json | null;
          onboarding_completed_at?: string | null;
          onboarding_skipped_at?: string | null;
          wants_budget_help?: boolean | null;
          primary_goals?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          base_currency?: string;
          tithe_target_percent?: number;
          manual_fx_rates?: Json | null;
          onboarding_completed_at?: string | null;
          onboarding_skipped_at?: string | null;
          wants_budget_help?: boolean | null;
          primary_goals?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string;
          color: string;
          is_default: boolean;
          classification: "essential" | "discretionary" | "giving" | "savings";
          applies_to: "expense" | "income" | "both";
          budget_role:
            | "housing"
            | "utilities"
            | "groceries"
            | "transport"
            | "healthcare"
            | "insurance"
            | "taxes"
            | "dining"
            | "shopping"
            | "subscriptions"
            | "entertainment"
            | "travel"
            | "personal_care"
            | "education"
            | "professional"
            | "cash"
            | "other"
            | "tithe"
            | "donations"
            | "savings"
            | "investments"
            | "loan_lent"
            | "income"
            | "debt_payment";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
          classification?: "essential" | "discretionary" | "giving" | "savings";
          applies_to?: "expense" | "income" | "both";
          budget_role?:
            | "housing"
            | "utilities"
            | "groceries"
            | "transport"
            | "healthcare"
            | "insurance"
            | "taxes"
            | "dining"
            | "shopping"
            | "subscriptions"
            | "entertainment"
            | "travel"
            | "personal_care"
            | "education"
            | "professional"
            | "cash"
            | "other"
            | "tithe"
            | "donations"
            | "savings"
            | "investments"
            | "loan_lent"
            | "income"
            | "debt_payment";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
          classification?: "essential" | "discretionary" | "giving" | "savings";
          applies_to?: "expense" | "income" | "both";
          budget_role?:
            | "housing"
            | "utilities"
            | "groceries"
            | "transport"
            | "healthcare"
            | "insurance"
            | "taxes"
            | "dining"
            | "shopping"
            | "subscriptions"
            | "entertainment"
            | "travel"
            | "personal_care"
            | "education"
            | "professional"
            | "cash"
            | "other"
            | "tithe"
            | "donations"
            | "savings"
            | "investments"
            | "loan_lent"
            | "income"
            | "debt_payment";
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          recurring_expense_id: string | null;
          recurring_month: string | null;
          amount: number;
          currency: string;
          description: string | null;
          date: string;
          source_kind: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref: string | null;
          import_batch_id: string | null;
          needs_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          recurring_expense_id?: string | null;
          recurring_month?: string | null;
          amount: number;
          currency?: string;
          description?: string | null;
          date?: string;
          source_kind?: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref?: string | null;
          import_batch_id?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          recurring_expense_id?: string | null;
          recurring_month?: string | null;
          amount?: number;
          currency?: string;
          description?: string | null;
          date?: string;
          source_kind?: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref?: string | null;
          import_batch_id?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_recurring_expense_id_fkey";
            columns: ["recurring_expense_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency: string;
          description: string | null;
          charge_day: number;
          start_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency?: string;
          description?: string | null;
          charge_day: number;
          start_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          currency?: string;
          description?: string | null;
          charge_day?: number;
          start_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      income_entries: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          amount: number;
          currency: string;
          description: string | null;
          date: string;
          category_id: string | null;
          source_kind: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref: string | null;
          import_batch_id: string | null;
          needs_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          amount: number;
          currency?: string;
          description?: string | null;
          date?: string;
          category_id?: string | null;
          source_kind?: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref?: string | null;
          import_batch_id?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          amount?: number;
          currency?: string;
          description?: string | null;
          date?: string;
          category_id?: string | null;
          source_kind?: "manual" | "import_csv" | "import_script" | "recurring";
          external_ref?: string | null;
          import_batch_id?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          user_id: string;
          source_format: "santander_csv" | "wise_csv";
          filename: string | null;
          status: "pending" | "committed" | "rolled_back" | "discarded";
          rows: Json;
          new_count: number;
          duplicate_count: number;
          uncategorized_count: number;
          created_at: string;
          committed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_format: "santander_csv" | "wise_csv";
          filename?: string | null;
          status?: "pending" | "committed" | "rolled_back" | "discarded";
          rows?: Json;
          new_count?: number;
          duplicate_count?: number;
          uncategorized_count?: number;
          created_at?: string;
          committed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_format?: "santander_csv" | "wise_csv";
          filename?: string | null;
          status?: "pending" | "committed" | "rolled_back" | "discarded";
          rows?: Json;
          new_count?: number;
          duplicate_count?: number;
          uncategorized_count?: number;
          created_at?: string;
          committed_at?: string | null;
        };
        Relationships: [];
      };
      categorization_rules: {
        Row: {
          id: string;
          user_id: string;
          match_type: "merchant_keyword" | "bank_category";
          pattern: string;
          category_id: string;
          priority: number;
          source: "seed" | "user";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_type: "merchant_keyword" | "bank_category";
          pattern: string;
          category_id: string;
          priority?: number;
          source?: "seed" | "user";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_type?: "merchant_keyword" | "bank_category";
          pattern?: string;
          category_id?: string;
          priority?: number;
          source?: "seed" | "user";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      liabilities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: "loan" | "mortgage" | "credit_card" | "personal" | "other";
          original_balance: number;
          currency: string;
          interest_rate_percent: number | null;
          opened_date: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kind?: "loan" | "mortgage" | "credit_card" | "personal" | "other";
          original_balance: number;
          currency?: string;
          interest_rate_percent?: number | null;
          opened_date?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          kind?: "loan" | "mortgage" | "credit_card" | "personal" | "other";
          original_balance?: number;
          currency?: string;
          interest_rate_percent?: number | null;
          opened_date?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      liability_payments: {
        Row: {
          id: string;
          liability_id: string;
          user_id: string;
          payment_date: string;
          amount: number;
          currency: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          liability_id: string;
          user_id: string;
          payment_date?: string;
          amount: number;
          currency?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          liability_id?: string;
          user_id?: string;
          payment_date?: string;
          amount?: number;
          currency?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "liability_payments_liability_id_fkey";
            columns: ["liability_id"];
            isOneToOne: false;
            referencedRelation: "liabilities";
            referencedColumns: ["id"];
          },
        ];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          borrower_name: string;
          principal: number;
          currency: string;
          lent_date: string;
          notes: string | null;
          is_active: boolean;
          expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          borrower_name: string;
          principal: number;
          currency?: string;
          lent_date?: string;
          notes?: string | null;
          is_active?: boolean;
          expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          borrower_name?: string;
          principal?: number;
          currency?: string;
          lent_date?: string;
          notes?: string | null;
          is_active?: boolean;
          expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loans_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      loan_repayments: {
        Row: {
          id: string;
          loan_id: string;
          user_id: string;
          repayment_date: string;
          amount: number;
          currency: string;
          note: string | null;
          income_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          user_id: string;
          repayment_date?: string;
          amount: number;
          currency?: string;
          note?: string | null;
          income_entry_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          user_id?: string;
          repayment_date?: string;
          amount?: number;
          currency?: string;
          note?: string | null;
          income_entry_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey";
            columns: ["loan_id"];
            isOneToOne: false;
            referencedRelation: "loans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loan_repayments_income_entry_id_fkey";
            columns: ["income_entry_id"];
            isOneToOne: false;
            referencedRelation: "income_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      wealth_accounts: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          name: string;
          institution: string | null;
          currency: string;
          opening_balance: number;
          opening_date: string;
          include_in_available: boolean;
          is_primary: boolean;
          color: string | null;
          icon: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: string;
          name: string;
          institution?: string | null;
          currency?: string;
          opening_balance?: number;
          opening_date?: string;
          include_in_available?: boolean;
          is_primary?: boolean;
          color?: string | null;
          icon?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          name?: string;
          institution?: string | null;
          currency?: string;
          opening_balance?: number;
          opening_date?: string;
          include_in_available?: boolean;
          is_primary?: boolean;
          color?: string | null;
          icon?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wealth_account_movements: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          movement_type: string;
          amount: number;
          currency: string;
          occurred_on: string;
          note: string | null;
          linked_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          movement_type: string;
          amount: number;
          currency?: string;
          occurred_on?: string;
          note?: string | null;
          linked_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          movement_type?: string;
          amount?: number;
          currency?: string;
          occurred_on?: string;
          note?: string | null;
          linked_account_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wealth_account_movements_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "wealth_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wealth_account_movements_linked_account_id_fkey";
            columns: ["linked_account_id"];
            isOneToOne: false;
            referencedRelation: "wealth_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      net_worth_snapshots: {
        Row: {
          id: string;
          user_id: string;
          as_of_date: string;
          base_currency: string;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          breakdown: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          as_of_date: string;
          base_currency: string;
          total_assets: number;
          total_liabilities: number;
          net_worth: number;
          breakdown?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          as_of_date?: string;
          base_currency?: string;
          total_assets?: number;
          total_liabilities?: number;
          net_worth?: number;
          breakdown?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      loan_people: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency: string;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency?: string;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          currency?: string;
          month?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_budget_plans: {
        Row: {
          id: string;
          user_id: string;
          income_amount: number;
          income_currency: string;
          allocation_percent: number;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          income_amount: number;
          income_currency?: string;
          allocation_percent?: number;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          income_amount?: number;
          income_currency?: string;
          allocation_percent?: number;
          month?: number;
          year?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_budgets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: string;
          amount_type: string;
          amount_value: number;
          currency: string;
          month: number;
          year: number;
          /** null → default 75/90/100 alert ladder; 50–99 → warn once at that %. */
          warn_threshold: number | null;
          /** Whether "Copiar <mes>" carries this budget forward. */
          repeats_monthly: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kind?: string;
          amount_type: string;
          amount_value: number;
          currency?: string;
          month: number;
          year: number;
          warn_threshold?: number | null;
          repeats_monthly?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          kind?: string;
          amount_type?: string;
          amount_value?: number;
          currency?: string;
          month?: number;
          year?: number;
          warn_threshold?: number | null;
          repeats_monthly?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      custom_budget_categories: {
        Row: {
          id: string;
          custom_budget_id: string;
          category_id: string;
        };
        Insert: {
          id?: string;
          custom_budget_id: string;
          category_id: string;
        };
        Update: {
          id?: string;
          custom_budget_id?: string;
          category_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_budget_categories_custom_budget_id_fkey";
            columns: ["custom_budget_id"];
            isOneToOne: false;
            referencedRelation: "custom_budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_budget_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      brokerage_accounts: {
        Row: {
          id: string;
          user_id: string;
          broker_kind: string;
          name: string;
          account_currency: string;
          fee_mode: string;
          fee_percent: number;
          fee_fixed_amount: number;
          fee_min_amount: number;
          fee_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          broker_kind: string;
          name: string;
          account_currency?: string;
          fee_mode?: string;
          fee_percent?: number;
          fee_fixed_amount?: number;
          fee_min_amount?: number;
          fee_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          broker_kind?: string;
          name?: string;
          account_currency?: string;
          fee_mode?: string;
          fee_percent?: number;
          fee_fixed_amount?: number;
          fee_min_amount?: number;
          fee_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_assets: {
        Row: {
          id: string;
          user_id: string;
          asset_key: string;
          symbol: string;
          display_name: string | null;
          asset_type: string;
          market_code: string;
          exchange_code: string | null;
          quote_currency: string;
          provider_symbol_twelve: string | null;
          provider_symbol_eodhd: string | null;
          is_price_supported: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_key: string;
          symbol: string;
          display_name?: string | null;
          asset_type: string;
          market_code: string;
          exchange_code?: string | null;
          quote_currency?: string;
          provider_symbol_twelve?: string | null;
          provider_symbol_eodhd?: string | null;
          is_price_supported?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset_key?: string;
          symbol?: string;
          display_name?: string | null;
          asset_type?: string;
          market_code?: string;
          exchange_code?: string | null;
          quote_currency?: string;
          provider_symbol_twelve?: string | null;
          provider_symbol_eodhd?: string | null;
          is_price_supported?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_trades: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          asset_id: string;
          side: string;
          trade_date: string;
          quantity: number;
          execution_price: number;
          execution_currency: string;
          reference_close_price: number | null;
          reference_close_currency: string | null;
          reference_price_date: string | null;
          reference_source: string | null;
          reference_status: string;
          fee_amount: number;
          fee_currency: string;
          notes: string | null;
          source_kind: string;
          external_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          asset_id: string;
          side: string;
          trade_date: string;
          quantity: number;
          execution_price: number;
          execution_currency: string;
          reference_close_price?: number | null;
          reference_close_currency?: string | null;
          reference_price_date?: string | null;
          reference_source?: string | null;
          reference_status?: string;
          fee_amount?: number;
          fee_currency?: string;
          notes?: string | null;
          source_kind?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          asset_id?: string;
          side?: string;
          trade_date?: string;
          quantity?: number;
          execution_price?: number;
          execution_currency?: string;
          reference_close_price?: number | null;
          reference_close_currency?: string | null;
          reference_price_date?: string | null;
          reference_source?: string | null;
          reference_status?: string;
          fee_amount?: number;
          fee_currency?: string;
          notes?: string | null;
          source_kind?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_trades_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "brokerage_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investment_trades_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "investment_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_cash_movements: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          movement_type: string;
          movement_date: string;
          amount: number;
          currency: string;
          fee_amount: number;
          fee_currency: string;
          notes: string | null;
          source_kind: string;
          external_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          movement_type: string;
          movement_date: string;
          amount: number;
          currency: string;
          fee_amount?: number;
          fee_currency?: string;
          notes?: string | null;
          source_kind?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          movement_type?: string;
          movement_date?: string;
          amount?: number;
          currency?: string;
          fee_amount?: number;
          fee_currency?: string;
          notes?: string | null;
          source_kind?: string;
          external_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_cash_movements_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "brokerage_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      investment_watchlist: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset_id?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_watchlist_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "investment_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      market_price_history: {
        Row: {
          id: string;
          provider: string;
          provider_symbol: string;
          quote_date: string;
          close: number;
          currency: string;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          provider_symbol: string;
          quote_date: string;
          close: number;
          currency: string;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          provider_symbol?: string;
          quote_date?: string;
          close?: number;
          currency?: string;
          fetched_at?: string;
        };
        Relationships: [];
      };
      investment_savings_accounts: {
        Row: {
          id: string;
          user_id: string;
          country_code: string;
          bank_code: string;
          bank_name: string;
          product_type: string;
          product_name: string;
          account_name: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          country_code: string;
          bank_code: string;
          bank_name: string;
          product_type: string;
          product_name: string;
          account_name: string;
          currency: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          country_code?: string;
          bank_code?: string;
          bank_name?: string;
          product_type?: string;
          product_name?: string;
          account_name?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      investment_savings_transfers: {
        Row: {
          id: string;
          user_id: string;
          savings_account_id: string;
          transfer_date: string;
          amount: number;
          currency: string;
          notes: string | null;
          source_kind: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          savings_account_id: string;
          transfer_date?: string;
          amount: number;
          currency: string;
          notes?: string | null;
          source_kind?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          savings_account_id?: string;
          transfer_date?: string;
          amount?: number;
          currency?: string;
          notes?: string | null;
          source_kind?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_savings_transfers_savings_account_id_fkey";
            columns: ["savings_account_id"];
            isOneToOne: false;
            referencedRelation: "investment_savings_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      monthly_expense_summary: {
        Row: {
          user_id: string;
          year: number;
          month: number;
          category_id: string;
          category_name: string;
          category_color: string;
          category_icon: string;
          currency: string;
          total_amount: number;
          expense_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_app_bootstrap: {
        Args: Record<string, never>;
        Returns: Json;
      };
      prepare_month_snapshot: {
        Args: { p_year: number; p_month: number; p_as_of?: string };
        Returns: Json;
      };
      get_household_insights: {
        Args: Record<string, never>;
        Returns: Json;
      };
      replace_custom_budget_set: {
        Args: {
          p_year: number;
          p_month: number;
          p_budgets: Json;
          p_replace_existing?: boolean;
        };
        Returns: number;
      };
      copy_custom_budgets_from_previous_month: {
        Args: { p_year: number; p_month: number };
        Returns: number;
      };
      copy_category_budgets_from_previous_month: {
        Args: { p_year: number; p_month: number };
        Returns: number;
      };
      create_expense_with_envelope_status: {
        Args: {
          p_category_id: string;
          p_amount: number;
          p_currency: string;
          p_date: string;
          p_description?: string | null;
        };
        Returns: Json;
      };
      household_expense_category_aggregates: {
        Args: { p_user_id: string; p_start_date: string };
        Returns: {
          month: string;
          category_id: string;
          category_name: string;
          classification: string | null;
          currency: string;
          total: number;
          expense_count: number;
        }[];
      };
      household_income_aggregates: {
        Args: { p_user_id: string; p_start_date: string };
        Returns: {
          month: string;
          currency: string;
          total: number;
        }[];
      };
      liability_payment_totals: {
        Args: { p_user_id: string };
        Returns: {
          liability_id: string;
          paid_total: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
