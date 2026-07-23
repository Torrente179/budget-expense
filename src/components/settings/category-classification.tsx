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
import {
  BUDGET_ROLES,
  type BudgetRole,
  budgetRoleLabel,
} from "@/lib/budgeting/budget-roles";
import { authorizedFetch } from "@/lib/query/authorized-fetch";
import { queryKeys } from "@/lib/query/keys";
import { useLocale } from "@/providers/locale-provider";

type Classification = "essential" | "discretionary" | "giving" | "savings";

/**
 * Tag each category with stewardship classification + budget_role so method
 * seeding knows which envelope to put it in.
 */
export function CategoryClassification() {
  const { locale, t, tc } = useLocale();
  const { categories, loading } = useCategories();
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const classificationOptions: { value: Classification; label: string }[] = [
    { value: "essential", label: t("Essential", "Esencial") },
    { value: "discretionary", label: t("Discretionary", "Discrecional") },
    { value: "giving", label: t("Giving", "Generosidad") },
    { value: "savings", label: t("Savings", "Ahorro") },
  ];

  const roleOptions = BUDGET_ROLES.map((value) => ({
    value,
    label: budgetRoleLabel(value, locale),
  }));

  async function patchCategory(
    categoryId: string,
    body: { classification?: Classification; budget_role?: BudgetRole }
  ) {
    setSavingId(categoryId);
    try {
      await authorizedFetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
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
          {t("Category roles", "Roles de categoría")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t(
            "Classification feeds Insights. Budget role decides which envelope a category joins when you apply a budgeting method.",
            "La clasificación alimenta Insights. El rol de presupuesto decide en qué sobre cae la categoría al aplicar un método."
          )}
        </p>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
              >
                <CategoryBadge
                  name={tc(category.name)}
                  icon={category.icon}
                  color={category.color}
                />
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                  <div className="w-full sm:w-40">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("Classification", "Clasificación")}
                    </p>
                    <Select
                      value={category.classification ?? "discretionary"}
                      onValueChange={(value) =>
                        value &&
                        void patchCategory(category.id, {
                          classification: value as Classification,
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        disabled={savingId === category.id}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classificationOptions.map((option) => (
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
                  <div className="w-full sm:w-48">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("Budget role", "Rol de presupuesto")}
                    </p>
                    <Select
                      value={category.budget_role ?? "other"}
                      onValueChange={(value) =>
                        value &&
                        void patchCategory(category.id, {
                          budget_role: value as BudgetRole,
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        disabled={savingId === category.id}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
