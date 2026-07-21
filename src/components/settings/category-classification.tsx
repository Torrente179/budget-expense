"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge } from "@/components/shared/category-badge";
import { useCategories } from "@/hooks/use-categories";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { useLocale } from "@/providers/locale-provider";

type Classification = "essential" | "discretionary" | "giving" | "savings";

/**
 * Tag each category as essential / discretionary / giving / savings.
 * Liquidity runway and the three-pillar rates are only as honest as these
 * tags. Writes go through /api/categories/[id], which dual-writes both
 * Supabase projects to keep the mirrored category rows in sync.
 */
export function CategoryClassification() {
  const { t, tc } = useLocale();
  const { categories, loading } = useCategories();
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const options: { value: Classification; label: string }[] = [
    { value: "essential", label: t("Essential", "Esencial") },
    { value: "discretionary", label: t("Discretionary", "Discrecional") },
    { value: "giving", label: t("Giving", "Generosidad") },
    { value: "savings", label: t("Savings", "Ahorro") },
  ];

  async function handleChange(categoryId: string, classification: Classification) {
    setSavingId(categoryId);
    try {
      await authorizedFetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({ classification }),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      await queryClient.invalidateQueries({ queryKey: ["household-insights"] });
    } catch {
      toast.error(
        t("Could not update the category", "No se pudo actualizar la categoría")
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("Category classification", "Clasificación de categorías")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(
            "Essential categories define your liquidity runway; giving categories feed the giving rate.",
            "Las categorías esenciales definen tu colchón de liquidez; las de generosidad alimentan tu tasa de dar."
          )}
        </p>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3">
                <CategoryBadge
                  name={tc(category.name)}
                  icon={category.icon}
                  color={category.color}
                />
                <div className="ml-auto w-44">
                  <Select
                    value={category.classification ?? "discretionary"}
                    onValueChange={(value) =>
                      value &&
                      handleChange(category.id, value as Classification)
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs"
                      disabled={savingId === category.id}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-sm"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
