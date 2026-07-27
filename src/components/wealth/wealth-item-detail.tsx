"use client";

import { useState, type ReactNode } from "react";
import { Archive, Pencil, type LucideIcon } from "lucide-react";
import { Screen } from "@/components/patterns/screen";
import { SectionHeader } from "@/components/patterns/section-header";
import { StatusTag } from "@/components/patterns/status-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { WealthBreadcrumb } from "@/components/wealth/wealth-breadcrumb";
import {
  WealthCategoryHero,
  type HeroStat,
} from "@/components/wealth/wealth-category-hero";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";

export interface DetailMovement {
  id: string;
  label: string;
  detail?: string;
  /** Signed, in the item's own currency. */
  amount: number;
  currency: string;
  date: string;
}

interface WealthItemDetailProps {
  title: string;
  breadcrumb: string;
  backHref: string;
  eyebrow: string;
  amount: number;
  icon: LucideIcon;
  stats?: HeroStat[];
  progress?: { ratio: number; label: string } | null;
  movements: DetailMovement[];
  archived?: boolean;
  onArchive?: () => void | Promise<void>;
  onEdit?: () => void;
  children?: ReactNode;
}

/**
 * The shared detail page for a single fund, holding, receivable or debt.
 *
 * The destructive action is **archive**, not delete. These rows feed
 * historical net worth; hard-deleting one silently rewrites months of the
 * Evolución chart, and nothing in the UI would explain why the line moved.
 */
export function WealthItemDetail({
  title,
  breadcrumb,
  backHref,
  eyebrow,
  amount,
  icon,
  stats,
  progress,
  movements,
  archived = false,
  onArchive,
  onEdit,
  children,
}: WealthItemDetailProps) {
  const { t, locale } = useLocale();
  const { baseCurrency } = useCurrency();
  const [confirmArchive, setConfirmArchive] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "es" ? "es-ES" : "en-US",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
  );

  return (
    <Screen
      title={title}
      backHref={backHref}
      subheader={<WealthBreadcrumb current={breadcrumb} />}
      actions={
        <>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">{t("Edit", "Editar")}</span>
            </Button>
          )}
          {onArchive && !archived && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmArchive(true)}
            >
              <Archive className="h-4 w-4" />
              <span className="hidden md:inline">
                {t("Archive", "Archivar")}
              </span>
            </Button>
          )}
        </>
      }
    >
      <WealthCategoryHero
        eyebrow={eyebrow}
        amount={amount}
        icon={icon}
        stats={stats}
        progress={progress}
      />

      {archived && (
        <StatusTag tone="neutral">
          {t(
            "Archived — it no longer counts toward net worth.",
            "Archivado — ya no cuenta en tu patrimonio."
          )}
        </StatusTag>
      )}

      {children}

      <Card>
        <CardHeader>
          <SectionHeader
            eyebrow={t("Activity", "Actividad")}
            title={t("Recent movements", "Movimientos recientes")}
          />
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <EmptyState
              icon={icon}
              title={t("No movements yet", "Aún no hay movimientos")}
              description={t(
                "Money in and out of this item will appear here.",
                "Las entradas y salidas de este elemento aparecerán aquí."
              )}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium">
                      {movement.label}
                    </p>
                    <p className="truncate text-caption text-muted-foreground">
                      {movement.detail
                        ? `${movement.detail} · `
                        : ""}
                      {dateFormatter.format(
                        new Date(`${movement.date}T00:00:00Z`)
                      )}
                    </p>
                  </div>
                  <p
                    className={
                      movement.amount < 0
                        ? "shrink-0 font-mono text-body tabular-nums text-negative"
                        : "shrink-0 font-mono text-body tabular-nums text-positive"
                    }
                  >
                    {movement.amount > 0 ? "+" : ""}
                    {formatCurrency(movement.amount, movement.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="px-1 text-caption text-muted-foreground">
        {t(
          `Figures convert to ${baseCurrency} on the Patrimonio screens.`,
          `Las cifras se convierten a ${baseCurrency} en las pantallas de Patrimonio.`
        )}
      </p>

      {onArchive && (
        <ConfirmDialog
          open={confirmArchive}
          onOpenChange={setConfirmArchive}
          title={t("Archive this item?", "¿Archivar este elemento?")}
          description={t(
            "It stops counting toward net worth from now on, but its history stays intact — unlike deleting, which would rewrite past months.",
            "Dejará de contar en tu patrimonio a partir de ahora, pero su historial se conserva — a diferencia de eliminarlo, que reescribiría meses pasados."
          )}
          confirmLabel={t("Archive", "Archivar")}
          onConfirm={async () => {
            await onArchive();
            setConfirmArchive(false);
          }}
        />
      )}
    </Screen>
  );
}
