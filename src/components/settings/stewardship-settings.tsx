"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/providers/locale-provider";

/** Giving target (% of income) — replaces the hardcoded 10% benchmark. */
export function StewardshipSettings() {
  const { t } = useLocale();
  const supabase = createClient();
  const [target, setTarget] = useState("10");
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims.sub;
      if (!userId) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tithe_target_percent")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        setAvailable(false); // column missing until migrations run
      } else if (data?.tithe_target_percent != null) {
        setTarget(String(Number(data.tithe_target_percent)));
      }
    }
    void load();
  }, [supabase]);

  async function handleSave() {
    const value = Number(target.replace(",", "."));
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error(t("Enter a percentage 0–100", "Introduce un porcentaje 0–100"));
      return;
    }
    setSaving(true);
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ tithe_target_percent: value })
        .eq("id", userId);
      if (error) {
        toast.error(
          t(
            "Could not save (is the 2026-07-03 migration applied?)",
            "No se pudo guardar (¿está aplicada la migración 2026-07-03?)"
          )
        );
      } else {
        toast.success(t("Giving target saved", "Meta de dar guardada"));
      }
    }
    setSaving(false);
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("Giving target", "Meta de generosidad")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(
            "The share of income you aim to give. Used by the giving insights and the household stewardship cards.",
            "La parte del ingreso que te propones dar. La usan las métricas de generosidad y las tarjetas de mayordomía."
          )}
        </p>
        <div className="flex items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="tithe-target">
              {t("Target (% of income)", "Meta (% del ingreso)")}
            </Label>
            <Input
              id="tithe-target"
              inputMode="decimal"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="w-28 font-mono tabular-nums"
              disabled={!available}
            />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving || !available}>
            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {t("Save", "Guardar")}
          </Button>
        </div>
        {!available && (
          <p className="text-xs text-destructive">
            {t(
              "Pending database migration — see docs/pending-migrations-runbook.md",
              "Migración de base de datos pendiente — ver docs/pending-migrations-runbook.md"
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
