"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/providers/currency-provider";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { Screen } from "@/components/patterns/screen";
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
import { ArrowRight, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/providers/locale-provider";
import { StewardshipSettings } from "@/components/settings/stewardship-settings";
import { CategoryClassification } from "@/components/settings/category-classification";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { baseCurrency, setBaseCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data?.display_name) setDisplayName(data.display_name);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  async function handleSaveProfile() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (error) {
        toast.error(t("Failed to update profile", "No se pudo actualizar el perfil"));
      } else {
        toast.success(t("Profile updated", "Perfil actualizado"));
      }
    }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      t(
        "Are you sure you want to delete your account? This cannot be undone.",
        "¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    );
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Delete user data (RLS will handle cascading)
      await supabase.from("expenses").delete().eq("user_id", user.id);
      await supabase.from("recurring_expenses").delete().eq("user_id", user.id);
      await supabase.from("income_entries").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("monthly_budget_plans").delete().eq("user_id", user.id);
      await supabase.from("investment_watchlist").delete().eq("user_id", user.id);
      await supabase.from("investment_trades").delete().eq("user_id", user.id);
      await supabase.from("investment_cash_movements").delete().eq("user_id", user.id);
      await supabase.from("investment_assets").delete().eq("user_id", user.id);
      await supabase.from("brokerage_accounts").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  }

  const themeOptions = [
    { value: "light", label: t("Light", "Claro"), icon: Sun },
    { value: "dark", label: t("Dark", "Oscuro"), icon: Moon },
    { value: "system", label: t("System", "Sistema"), icon: Monitor },
  ];

  return (
    <Screen title={t("Settings", "Ajustes")} backHref="/home">
      <div className="mx-auto w-full max-w-2xl space-y-6">

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
              value={displayName}
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
            onValueChange={(v) => setBaseCurrency(v as CurrencyCode)}
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

      {/* Stewardship */}
      <StewardshipSettings />
      <CategoryClassification />

      {/* Liabilities moved to Wealth */}
      <Link
        href="/wealth/liabilities"
        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3.5 transition-colors hover:bg-secondary"
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

      {/* Theme */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("Appearance", "Apariencia")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themeOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setTheme(opt.value)}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-destructive">
            {t("Danger zone", "Zona de peligro")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(
              "Permanently delete your account and all associated data. This action cannot be undone.",
              "Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer."
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
    </Screen>
  );
}
