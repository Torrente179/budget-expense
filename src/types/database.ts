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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          base_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          base_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          base_currency?: string;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
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
          amount_type: string;
          amount_value: number;
          currency: string;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount_type: string;
          amount_value: number;
          currency?: string;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount_type?: string;
          amount_value?: number;
          currency?: string;
          month?: number;
          year?: number;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
