"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  biblicalThemes,
  nblaAttribution,
  nblaLink,
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

const themeIconMap: Record<string, ComponentType<{ className?: string }>> = {
  "administracion-de-bienes": Landmark,
  "trabajo-y-tiempo-sabio": Clock3,
  "generosidad-y-ayuda-al-pobre": HandHeart,
  "ofrenda-y-donacion": HandCoins,
  "contentamiento-y-deuda": Coins,
  "consejo-planeacion-e-integridad": Scale,
};

export default function WisdomPage() {
  const [activeThemeSlug, setActiveThemeSlug] = useState(biblicalThemes[0].slug);

  const activeTheme = useMemo(
    () =>
      biblicalThemes.find((theme) => theme.slug === activeThemeSlug) ??
      biblicalThemes[0],
    [activeThemeSlug]
  );

  const ThemeIcon = themeIconMap[activeTheme.slug] ?? BookOpenText;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sabiduría"
        description="Principios financieros en español para administrar bienes, tiempo, generosidad y decisiones con más claridad."
      >
        <Link href={nblaLink} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            NuevaBiblia.com
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="border-border/70 xl:sticky xl:top-24 xl:h-fit">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="bg-background/70 text-foreground">
              Guía temática
            </Badge>
            <CardTitle className="font-heading text-3xl leading-none">
              Temas para revisar con calma
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              No es un catálogo de frases. Es un marco para pensar tu mes con
              administración, diligencia y generosidad.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {biblicalThemes.map((theme) => {
              const Icon = themeIconMap[theme.slug] ?? BookOpenText;
              const active = theme.slug === activeThemeSlug;

              return (
                <button
                  key={theme.slug}
                  type="button"
                  onClick={() => setActiveThemeSlug(theme.slug)}
                  className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition-all duration-200 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_20px_40px_-26px_rgba(49,84,71,0.65)]"
                      : "border-border/60 bg-background/72 text-foreground hover:border-foreground/12 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
                        active ? "bg-primary-foreground/12" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p
                        className={`text-[0.68rem] uppercase tracking-[0.24em] ${
                          active
                            ? "text-primary-foreground/70"
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
          <Card className="border-border/70">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="bg-background/70 text-foreground">
                    {activeTheme.eyebrow}
                  </Badge>
                  <div>
                    <CardTitle className="font-heading text-4xl leading-none tracking-tight">
                      {activeTheme.title}
                    </CardTitle>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {activeTheme.summary}
                    </p>
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-primary/12 text-primary">
                  <ThemeIcon className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-border/60 bg-background/72 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Pasajes para consultar en NBLA
                  </p>
                  <div className="mt-4 space-y-3">
                    {activeTheme.passages.map((passage) => (
                      <article
                        key={passage.reference}
                        className="rounded-[1.35rem] border border-border/60 bg-card/82 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm font-semibold text-foreground">
                            {passage.reference}
                          </p>
                          <Link href={nblaLink} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1">
                              Leer en NBLA
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {passage.takeaway}
                        </p>
                        <div className="mt-4 rounded-2xl bg-secondary/65 px-4 py-3 text-sm leading-6 text-secondary-foreground">
                          <span className="font-medium text-foreground">
                            Práctica:
                          </span>{" "}
                          {passage.practice}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-border/60 bg-background/72 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Acción concreta
                  </p>
                  <ul className="mt-4 space-y-3">
                    {activeTheme.actions.map((action, index) => (
                      <li
                        key={action}
                        className="flex items-start gap-3 rounded-[1.2rem] border border-border/50 bg-card/82 px-4 py-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-foreground/90">{action}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.6rem] border border-border/60 bg-card/82 p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                    Nota de uso
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Esta sección resume principios y referencias para ayudarte a
                    pensar con más orden. Úsala como guía de revisión mensual,
                    no como reemplazo del texto bíblico completo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="flex flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
                  Aviso NBLA
                </p>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {nblaAttribution}
                </p>
              </div>
              <Link href={nblaLink} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-1.5">
                  Visitar NuevaBiblia.com
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
