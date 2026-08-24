"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/providers/currency-provider";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { Screen } from "@/components/patterns/screen";
import { ContinuousSheet } from "@/components/patterns/continuous-sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/providers/locale-provider";
import { LanguagePreferenceList } from "@/components/shared/language-switch";
import { StewardshipSettings } from "@/components/settings/stewardship-settings";
import { BalanceCheckpointSettings } from "@/components/settings/balance-checkpoint-settings";
import { CategoryClassification } from "@/components/settings/category-classification";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { queryKeys } from "@/lib/query/keys";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    baseCurrency,
    currencyPreferenceReady,
    currencyPreferenceUpdating,
    setBaseCurrency,
  } = useCurrency();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useLocale();
  const { incomplete } = useOnboarding();
  const bootstrap = useAppBootstrap();
  const userId = bootstrap.data?.identity.id;
  const loading = bootstrap.isPending;

  async function handleSaveProfile() {
    setSaving(true);
    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name:
            displayName ?? bootstrap.data?.profile.displayName ?? "",
        })
        .eq("id", userId);
      if (error) {
        toast.error(t("Failed to update profile", "No se pudo actualizar el perfil"));
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.appBootstrap });
        toast.success(t("Profile updated", "Perfil actualizado"));
      }
    }
    setSaving(false);
  }

  async function handleCurrencyChange(code: CurrencyCode) {
    try {
      await setBaseCurrency(code);
    } catch (error) {
      console.error("Failed to update profile currency", error);
      toast.error(
        t("Failed to update currency", "No se pudo actualizar la moneda")
      );
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      t(
        "Are you sure you want to delete your account? This cannot be undone.",
        "¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    );
    if (!confirmed) return;

    if (userId) {
      // Delete user data (RLS will handle cascading)
      await supabase.from("expenses").delete().eq("user_id", userId);
      await supabase.from("recurring_expenses").delete().eq("user_id", userId);
      await supabase.from("income_entries").delete().eq("user_id", userId);
      await supabase.from("budgets").delete().eq("user_id", userId);
      await supabase.from("monthly_budget_plans").delete().eq("user_id", userId);
      await supabase.from("investment_watchlist").delete().eq("user_id", userId);
      await supabase.from("investment_trades").delete().eq("user_id", userId);
      await supabase.from("investment_cash_movements").delete().eq("user_id", userId);
      await supabase.from("investment_assets").delete().eq("user_id", userId);
      await supabase.from("brokerage_accounts").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  }


  return (
    <Screen
      title={t("Settings", "Ajustes")}
      backHref="/home"
      mode="chrome-sheet"
    >
      <div className="w-full max-w-3xl md:mx-auto">
      <ContinuousSheet className="md:mx-0">
      <div className="divide-y divide-border/70 [&_[data-slot=card]]:gap-3 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-5 [&_[data-slot=card]]:ring-0">

      {incomplete && (
        <Link
          href="/onboarding"
          className="flex min-h-16 items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40"
        >
          <span className="flex min-w-0 items-start gap-3">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-body font-medium">
                {t("Setup guide", "Guía de configuración")}
              </span>
              <span className="block text-caption text-muted-foreground">
                {t(
                  "Resume income, bills, debts, and goals",
                  "Retoma ingresos, gastos fijos, deudas y metas"
                )}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* Language — lives in Settings, not in screen chrome */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("Language", "Idioma")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(
              "Choose the language used across the app.",
              "Elige el idioma de la aplicación."
            )}
          </p>
          <LanguagePreferenceList />
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("Profile", "Perfil")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">
              {t("Display name", "Nombre visible")}
            </Label>
            <Input
              id="display-name"
              value={displayName ?? bootstrap.data?.profile.displayName ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("Your name", "Tu nombre")}
              disabled={loading}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={saving || loading}
          >
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {t("Save name", "Guardar nombre")}
          </Button>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("Currency", "Moneda")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(
              "All amounts across the app will be displayed in your selected currency. Original amounts are preserved.",
              "Todos los montos de la app se mostrarán en tu moneda seleccionada. Los importes originales se conservan."
            )}
          </p>
          <Select
            value={baseCurrency}
            onValueChange={(value) => {
              void handleCurrencyChange(value as CurrencyCode);
            }}
            disabled={
              !currencyPreferenceReady || currencyPreferenceUpdating
            }
          >
            <SelectTrigger className="w-full max-w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="mr-2">{c.flag}</span>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Available balance reconciliation */}
      <BalanceCheckpointSettings />

      {/* Stewardship */}
      <StewardshipSettings />
      <CategoryClassification />

      {/* Liabilities moved to Wealth */}
      <Link
        href="/wealth/liabilities"
        className="flex min-h-16 items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40"
      >
        <span className="min-w-0">
          <span className="block text-body font-medium">
            {t("Debts & liabilities", "Deudas y pasivos")}
          </span>
          <span className="block text-caption text-muted-foreground">
            {t(
              "Manage loans, mortgages, and credit in Wealth",
              "Gestiona préstamos, hipotecas y crédito en Patrimonio"
            )}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>

      {/* Account deletion */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-destructive">
            {t("Delete account", "Eliminar cuenta")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(
              "This removes your account and everything in it. It can't be undone.",
              "Esto borra tu cuenta y todo lo que hay en ella. No se puede deshacer."
            )}
          </p>
          <Separator />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
          >
            {t("Delete account", "Eliminar cuenta")}
          </Button>
        </CardContent>
      </Card>
      </div>
      </ContinuousSheet>
    </div>
    </Screen>
  );
}
