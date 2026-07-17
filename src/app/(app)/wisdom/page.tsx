"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { getBiblicalWisdomContent } from "@/lib/biblical-wisdom";
import { getFinancialWisdomContent } from "@/lib/financial-wisdom";
import {
  getBudgetingMethods,
  type BudgetingMethod,
} from "@/lib/budgeting-methods";
import { Screen } from "@/components/patterns/screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  Check,
  Clock3,
  Coins,
  HandCoins,
  HandHeart,
  Landmark,
  Layers,
  Scale,
  Star,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "@/providers/locale-provider";

/* ------------------------------------------------------------------ */
/*  Icon maps                                                          */
/* ------------------------------------------------------------------ */

const themeIconMap: Record<string, ComponentType<{ className?: string }>> = {
  "administracion-de-bienes": Landmark,
  "trabajo-y-tiempo-sabio": Clock3,
  "generosidad-y-ayuda-al-pobre": HandHeart,
  "ofrenda-y-donacion": HandCoins,
  "contentamiento-y-deuda": Coins,
  "consejo-planeacion-e-integridad": Scale,
};

const sectionIconMap: Record<string, ComponentType<{ className?: string }>> = {
  "book-open": BookOpen,
  star: Star,
};

/* ------------------------------------------------------------------ */
/*  Method card (mini)                                                 */
/* ------------------------------------------------------------------ */

function MethodMiniCard({
  method,
  index,
}: {
  method: BudgetingMethod;
  index: number;
}) {
  const { t } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-foreground">{method.name}</p>
        {method.isFaithBased && (
          <Badge
            variant="outline"
            className="bg-warning-subtle text-label text-warning"
          >
            {t("Faith-based", "Basado en fe")}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{method.tagline}</p>

      {/* Allocation bar */}
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full">
        {method.slices.map((slice) => (
          <div
            key={slice.key}
            style={{
              width: `${slice.percent}%`,
              backgroundColor: slice.color,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {method.slices.map((s) => (
          <span key={s.key} className="text-label text-muted-foreground">
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label} {s.percent}%
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {method.description}
      </p>

      {/* Principles */}
      {method.principles.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {method.principles.slice(0, 3).map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs leading-5 text-foreground/80"
            >
              <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
              <span>
                {p.text}
                {p.reference && (
                  <span className="ml-1 font-mono text-muted-foreground">
                    ({p.reference})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-label italic text-muted-foreground">
        {method.origin}
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function WisdomPage() {
  const { locale, t } = useLocale();
  const biblicalContent = useMemo(
    () => getBiblicalWisdomContent(locale),
    [locale]
  );
  const financialContent = useMemo(
    () => getFinancialWisdomContent(locale),
    [locale]
  );
  const methodsContent = useMemo(() => getBudgetingMethods(locale), [locale]);

  const [activeThemeSlug, setActiveThemeSlug] = useState(
    biblicalContent.themes[0].slug
  );
  const [activeTab, setActiveTab] = useState("stewardship");

  useEffect(() => {
    if (
      !biblicalContent.themes.some((theme) => theme.slug === activeThemeSlug)
    ) {
      setActiveThemeSlug(biblicalContent.themes[0].slug);
    }
  }, [activeThemeSlug, biblicalContent.themes]);

  const activeTheme = useMemo(
    () =>
      biblicalContent.themes.find((theme) => theme.slug === activeThemeSlug) ??
      biblicalContent.themes[0],
    [activeThemeSlug, biblicalContent.themes]
  );

  const ThemeIcon = themeIconMap[activeTheme.slug] ?? BookOpenText;
  const translationCodes = biblicalContent.translations
    .map((translation) => translation.code)
    .join(" / ");

  return (
    <Screen
      title={t("Wisdom & guidance", "Sabiduría y guía")}
      backHref="/insights"
      actions={
        <div className="hidden items-center gap-1.5 sm:flex">
          {biblicalContent.translations.map((translation) => (
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
        </div>
      }
    >

      {/* ------------------------------------------------------------ */}
      {/*  Tab navigation                                               */}
      {/* ------------------------------------------------------------ */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex w-full flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger
            value="stewardship"
            className="gap-1.5 rounded-lg border border-border/70 px-4 py-2.5 text-sm data-[state=active]:bg-secondary data-[state=active]:ring-1 data-[state=active]:ring-border"
          >
            <BookOpenText className="h-3.5 w-3.5" />
            {t("Biblical stewardship", "Mayordomía bíblica")}
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className="gap-1.5 rounded-lg border border-border/70 px-4 py-2.5 text-sm data-[state=active]:bg-secondary data-[state=active]:ring-1 data-[state=active]:ring-border"
          >
            <Layers className="h-3.5 w-3.5" />
            {t("Budgeting methods", "Métodos de presupuesto")}
          </TabsTrigger>
          <TabsTrigger
            value="principles"
            className="gap-1.5 rounded-lg border border-border/70 px-4 py-2.5 text-sm data-[state=active]:bg-secondary data-[state=active]:ring-1 data-[state=active]:ring-border"
          >
            <Star className="h-3.5 w-3.5" />
            {t("Financial principles", "Principios financieros")}
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="gap-1.5 rounded-lg border border-border/70 px-4 py-2.5 text-sm data-[state=active]:bg-secondary data-[state=active]:ring-1 data-[state=active]:ring-border"
          >
            <Wrench className="h-3.5 w-3.5" />
            {t("Tools & apps", "Herramientas y apps")}
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------- */}
        {/*  TAB 1: Biblical stewardship (original wisdom page)         */}
        {/* ---------------------------------------------------------- */}

        <TabsContent value="stewardship" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <Card className="bg-card xl:sticky xl:top-24 xl:h-fit">
              <CardHeader className="space-y-3">
                <Badge
                  variant="outline"
                  className="bg-secondary/70 text-foreground"
                >
                  {t("Theme guide", "Guía temática")}
                </Badge>
                <CardTitle className="font-heading text-title font-semibold leading-none tracking-tight">
                  {t(
                    "Themes to review calmly",
                    "Temas para revisar con calma"
                  )}
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(
                    "This is not a quote catalog. It is a framework to think through your month with stewardship, diligence, and generosity.",
                    "No es un catálogo de frases. Es un marco para pensar tu mes con administración, diligencia y generosidad."
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {biblicalContent.themes.map((theme) => {
                  const Icon = themeIconMap[theme.slug] ?? BookOpenText;
                  const active = theme.slug === activeThemeSlug;

                  return (
                    <button
                      key={theme.slug}
                      type="button"
                      onClick={() => setActiveThemeSlug(theme.slug)}
                      className={`w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
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
                          <p className="label-caps">
                            {theme.eyebrow}
                          </p>
                          <p className="text-sm font-medium leading-5">
                            {theme.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <Badge
                        variant="outline"
                        className="bg-secondary/70 text-foreground"
                      >
                        {activeTheme.eyebrow}
                      </Badge>
                      <div>
                        <CardTitle className="font-heading text-display font-semibold leading-none tracking-tight">
                          {activeTheme.title}
                        </CardTitle>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                          {activeTheme.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-success">
                      <ThemeIcon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/70 bg-secondary/45 p-5">
                      <p className="label-caps">
                        {t(
                          `Passages to review in ${translationCodes}`,
                          `Pasajes para consultar en ${translationCodes}`
                        )}
                      </p>
                      <div className="mt-4 space-y-3">
                        {activeTheme.passages.map((passage) => (
                          <article
                            key={passage.reference}
                            className="rounded-xl border bg-card p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-mono text-sm font-semibold text-foreground">
                                {passage.reference}
                              </p>
                              <div className="flex flex-wrap justify-end gap-2">
                                {biblicalContent.translations.map(
                                  (translation) => (
                                    <Badge
                                      key={translation.code}
                                      variant="outline"
                                      className="bg-secondary/55 text-label tracking-widest"
                                    >
                                      {translation.code}
                                    </Badge>
                                  )
                                )}
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
                    <div className="rounded-xl border border-border/70 bg-secondary/45 p-5">
                      <p className="label-caps">
                        {t("Concrete action", "Acción concreta")}
                      </p>
                      <ul className="mt-4 space-y-3">
                        {activeTheme.actions.map((action, index) => (
                          <li
                            key={action}
                            className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-6 text-foreground/90">
                              {action}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border bg-card p-5">
                      <p className="label-caps">
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

              <Card className="bg-card">
                <CardContent className="flex flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="label-caps">
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
                {biblicalContent.translations.map((translation) => (
                  <Card
                    key={translation.code}
                    className="bg-card"
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="label-caps">
                            {translation.code}
                          </p>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {translation.name}
                          </p>
                        </div>
                        <Link
                          href={translation.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                          >
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
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  TAB 2: Budgeting methods                                   */}
        {/* ---------------------------------------------------------- */}

        <TabsContent value="methods" className="space-y-6">
          <Card className="bg-card">
            <CardHeader className="space-y-3">
              <Badge
                variant="outline"
                className="bg-secondary/70 text-foreground"
              >
                {t("Framework guide", "Guía de marcos")}
              </Badge>
              <CardTitle className="font-heading text-display font-semibold leading-none tracking-tight md:text-display">
                {t("Budgeting methods", "Métodos de presupuesto")}
              </CardTitle>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  "There is no single best method. The right framework depends on your income, obligations, values, and stage of life. Explore each one and apply it to your monthly plan from the Budgets page.",
                  "No existe un solo mejor método. El marco adecuado depende de tu ingreso, obligaciones, valores y etapa de vida. Explora cada uno y aplícalo a tu plan mensual desde la página de Presupuestos."
                )}
              </p>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {methodsContent.methods.map((method, index) => (
              <MethodMiniCard
                key={method.id}
                method={method}
                index={index}
              />
            ))}
          </div>

          {/* Additional systems */}
          <Card className="bg-card">
            <CardHeader className="space-y-3">
              <Badge
                variant="outline"
                className="bg-secondary/70 text-foreground"
              >
                {t("Additional systems", "Sistemas adicionales")}
              </Badge>
              <CardTitle className="font-heading text-title font-semibold leading-none tracking-tight md:text-display">
                {financialContent.additionalSystems.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialContent.additionalSystems.entries.map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-xl border border-border/70 bg-secondary/40 p-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {entry.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {entry.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  TAB 3: Financial principles (biblical + Jewish)            */}
        {/* ---------------------------------------------------------- */}

        <TabsContent value="principles" className="space-y-6">
          {financialContent.sections.map((section) => {
            const SIcon = sectionIconMap[section.icon] ?? BookOpen;
            return (
              <Card
                key={section.id}
                className="bg-card"
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <Badge
                        variant="outline"
                        className="bg-secondary/70 text-foreground"
                      >
                        {section.eyebrow}
                      </Badge>
                      <CardTitle className="font-heading text-display font-semibold leading-none tracking-tight md:text-display">
                        {section.title}
                      </CardTitle>
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                        {section.intro}
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-success">
                      <SIcon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {section.entries.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.03,
                          duration: 0.24,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="rounded-xl border border-border/70 bg-secondary/40 p-4"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {entry.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {entry.text}
                        </p>
                        {entry.reference && (
                          <p className="mt-2 font-mono text-xs text-success">
                            {entry.reference}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        {/*  TAB 4: Tools & apps                                        */}
        {/* ---------------------------------------------------------- */}

        <TabsContent value="tools" className="space-y-6">
          <Card className="bg-card">
            <CardHeader className="space-y-3">
              <Badge
                variant="outline"
                className="bg-secondary/70 text-foreground"
              >
                {t("Apps & tools", "Apps y herramientas")}
              </Badge>
              <CardTitle className="font-heading text-display font-semibold leading-none tracking-tight md:text-display">
                {financialContent.toolsSection.title}
              </CardTitle>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {financialContent.toolsSection.intro}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialContent.toolsSection.tools.map((tool) => (
                <div
                  key={tool.name}
                  className="rounded-xl border border-border/70 bg-secondary/40 p-4"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {tool.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-secondary/60 text-label"
                    >
                      {tool.tagline}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              ))}

              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {financialContent.toolsSection.closingNote}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Screen>
  );
}
