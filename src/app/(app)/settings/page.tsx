"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/providers/currency-provider";
import { CURRENCIES, type CurrencyCode } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
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
import { Loader2, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { baseCurrency, setBaseCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const router = useRouter();

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
        toast.error("Failed to update profile");
      } else {
        toast.success("Profile updated");
      }
    }
    setSaving(false);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Delete user data (RLS will handle cascading)
      await supabase.from("expenses").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={saving || loading}
          >
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save name
          </Button>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Currency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All amounts across the app will be displayed in your selected
            currency. Original amounts are preserved.
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

      {/* Theme */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Appearance</CardTitle>
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
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Separator />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
          >
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
