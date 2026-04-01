"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  getBiblicalWisdomContent,
} from "@/lib/biblical-wisdom";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  BookOpenText,
  Clock3,
  Coins,
  HandCoins,
  HandHeart,
  Landmark,
  Scale,
} from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

const themeIconMap: Record<string, ComponentType<{ className?: string }>> = {
  "administracion-de-bienes": Landmark,
  "trabajo-y-tiempo-sabio": Clock3,
  "generosidad-y-ayuda-al-pobre": HandHeart,
  "ofrenda-y-donacion": HandCoins,
  "contentamiento-y-deuda": Coins,
  "consejo-planeacion-e-integridad": Scale,
};

export default function WisdomPage() {
  const { locale, t } = useLocale();
  const content = useMemo(() => getBiblicalWisdomContent(locale), [locale]);
  const [activeThemeSlug, setActiveThemeSlug] = useState(content.themes[0].slug);

  useEffect(() => {
    if (!content.themes.some((theme) => theme.slug === activeThemeSlug)) {
      setActiveThemeSlug(content.themes[0].slug);
    }
  }, [activeThemeSlug, content.themes]);

  const activeTheme = useMemo(
    () =>
      content.themes.find((theme) => theme.slug === activeThemeSlug) ??
      content.themes[0],
    [activeThemeSlug, content.themes]
  );

  const ThemeIcon = themeIconMap[activeTheme.slug] ?? BookOpenText;
  const translationCodes = content.translations.map((translation) => translation.code).join(" / ");

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("Wisdom", "Sabiduría")}
        description={t(
          "Biblical financial principles in English to manage resources, time, generosity, and decisions with more clarity.",
          "Principios financieros bíblicos en español para administrar bienes, tiempo, generosidad y decisiones con más claridad."
        )}
      >
        {content.translations.map((translation) => (
          <Link
            key={translation.code}
            href={translation.link}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              {translation.code}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        ))}
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/96 xl:sticky xl:top-24 xl:h-fit">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="bg-secondary/70 text-foreground">
              {t("Theme guide", "Guía temática")}
            </Badge>
            <CardTitle className="font-heading text-[1.9rem] font-semibold leading-none tracking-[-0.04em]">
              {t("Themes to review calmly", "Temas para revisar con calma")}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {t(
                "This is not a quote catalog. It is a framework to think through your month with stewardship, diligence, and generosity.",
                "No es un catálogo de frases. Es un marco para pensar tu mes con administración, diligencia y generosidad."
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.themes.map((theme) => {
              const Icon = themeIconMap[theme.slug] ?? BookOpenText;
              const active = theme.slug === activeThemeSlug;

              return (
                <button
                  key={theme.slug}
                  type="button"
                  onClick={() => setActiveThemeSlug(theme.slug)}
                  className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 ${
                    active
                      ? "border-border bg-secondary text-foreground ring-1 ring-border"
                      : "border-border/70 bg-card/92 text-foreground hover:border-foreground/12 hover:bg-secondary/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-foreground text-background"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p
                        className={`text-[0.68rem] uppercase tracking-[0.24em] ${
                          active
                            ? "text-muted-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {theme.eyebrow}
                      </p>
                      <p className="text-sm font-medium leading-5">{theme.title}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 bg-card/96">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-secondary/70 text-foreground">
                    {activeTheme.eyebrow}
                  </Badge>
                  <div>
                    <CardTitle className="font-heading text-[2.6rem] font-semibold leading-none tracking-[-0.05em]">
                      {activeTheme.title}
                    </CardTitle>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {activeTheme.summary}
                    </p>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-secondary text-emerald-300">
                  <ThemeIcon className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-border/70 bg-secondary/45 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    {t(
                      `Passages to review in ${translationCodes}`,
                      `Pasajes para consultar en ${translationCodes}`
                    )}
                  </p>
                  <div className="mt-4 space-y-3">
                    {activeTheme.passages.map((passage) => (
                      <article
                        key={passage.reference}
                        className="rounded-[1.35rem] border border-border/70 bg-card/96 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm font-semibold text-foreground">
                            {passage.reference}
                          </p>
                          <div className="flex flex-wrap justify-end gap-2">
                            {content.translations.map((translation) => (
                              <Badge
                                key={translation.code}
                                variant="outline"
                                className="bg-secondary/55 text-[0.65rem] tracking-[0.16em]"
                              >
                                {translation.code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {passage.takeaway}
                        </p>
                        <div className="mt-4 rounded-2xl bg-secondary/65 px-4 py-3 text-sm leading-6 text-secondary-foreground">
                          <span className="font-medium text-foreground">
                            {t("Practice", "Práctica")}:
                          </span>{" "}
                          {passage.practice}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-border/70 bg-secondary/45 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    {t("Concrete action", "Acción concreta")}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {activeTheme.actions.map((action, index) => (
                      <li
                        key={action}
                        className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-card/96 px-4 py-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-foreground/90">{action}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.6rem] border border-border/70 bg-card/96 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    {t("Usage note", "Nota de uso")}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {t(
                      "This section summarizes principles and references to help you think with better structure. Use it as a monthly review guide, not as a replacement for the full biblical text.",
                      "Esta sección resume principios y referencias para ayudarte a pensar con más orden. Úsala como guía de revisión mensual, no como reemplazo del texto bíblico completo."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/96">
            <CardContent className="flex flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  {t("Bible sources", "Fuentes bíblicas")}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {t(
                    "This page summarizes financial stewardship themes and uses these official Bible translation families for English references.",
                    "Esta página resume temas de mayordomía financiera y usa estas familias oficiales de traducción bíblica para las referencias en español."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {content.translations.map((translation) => (
              <Card key={translation.code} className="border-border/80 bg-card/96">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                        {translation.code}
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {translation.name}
                      </p>
                    </div>
                    <Link href={translation.link} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        {t("Open source", "Abrir fuente")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {translation.notice}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
