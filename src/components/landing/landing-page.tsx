"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { StaticCurrencyProvider } from "@/providers/currency-provider";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import { BrowserFrame, PhoneFrame } from "@/components/landing/device-frame";
import { DesktopDemoScreen } from "@/components/landing/screens/desktop-screen";
import {
  BudgetDemoScreen,
  HomeDemoScreen,
  InsightsDemoScreen,
  WealthDemoScreen,
} from "@/components/landing/screens/phone-screens";

/**
 * The secondary action, on ink and on coral.
 *
 * Deliberately not `buttonVariants({ variant: "outline" })`: that variant
 * paints `bg-white`, and a `bg-transparent` override is a coin-flip against it
 * in the generated stylesheet — which is exactly how this shipped invisible
 * once already. Same geometry as the shared pill, no competing background.
 */
const quietPill =
  "inline-flex shrink-0 items-center justify-center rounded-full border text-sm font-medium whitespace-nowrap transition-colors";
const quietSize = {
  sm: "min-h-11 px-3.5 text-caption md:min-h-9",
  lg: "min-h-12 px-5",
};
const quietTone = {
  ink: "border-white/25 text-white hover:border-white/60 hover:bg-white/10",
  coral: "border-ink/25 text-ink hover:border-ink/60 hover:bg-ink/10",
};

/**
 * The primary action on the coral band, where the shared coral pill would be
 * invisible. Same reason as `quietPill`: overriding `bg-primary` in a
 * `buttonVariants` className is not a fight worth having.
 */
const inkPill =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-ink-2";

/**
 * The public page a signed-out visitor lands on.
 *
 * Structure is the "tour" direction from `mockups/landing/d-tour.html`: a short
 * hero carrying the desktop app, then one section per product area — each with
 * that area's real screen next to a plain statement of what it does — and a
 * close. The tour is the argument, so the hero stays deliberately small.
 *
 * Everything a visitor can click leads to exactly two places: `/signup` and
 * `/login`. The screens themselves are inert (see `device-frame.tsx`).
 */
export function LandingPage() {
  const { t } = useLocale();

  const sections = [
    {
      id: "home",
      index: "01",
      eyebrow: t("Home", "Inicio"),
      title: t(
        "Open it, and know where you stand.",
        "Ábrela y sabrás cómo estás."
      ),
      body: t(
        "The top of Home is one figure: what you can actually spend. Below it the month runs as a dated feed — merchant, time, amount — the way a statement should have read all along.",
        "Arriba en Inicio hay una sola cifra: lo que realmente puedes gastar. Debajo, el mes corre como un historial por fechas — comercio, hora, importe — como siempre debió leerse un extracto."
      ),
      points: [
        t(
          "Available carries across months instead of resetting on the 1st",
          "El disponible se arrastra entre meses en vez de reiniciarse el día 1"
        ),
        t(
          "Money in, money out, and a daily guide from what is left",
          "Lo que entra, lo que sale y una guía diaria de lo que queda"
        ),
        t(
          "Add anything from one sheet — amount first, category suggested",
          "Añade cualquier cosa desde una sola hoja — importe primero, categoría sugerida"
        ),
      ],
      screen: <HomeDemoScreen />,
      screenLabel: t(
        "The Home screen: an available balance of €2,847.30 over a dated feed of the month's movements.",
        "La pantalla de Inicio: un saldo disponible de 2.847,30 € sobre el historial del mes por fechas."
      ),
      ground: "white" as const,
      flip: false,
    },
    {
      id: "budget",
      index: "02",
      eyebrow: t("Budget", "Presupuesto"),
      title: t(
        "A limit that tells you what is left.",
        "Un límite que te dice lo que queda."
      ),
      body: t(
        "Trackers are ceilings and Metas are goals, and neither speaks in percentages. A tracker says €124 left until you pass the limit, and only then does it say €38 over, in red.",
        "Los presupuestos son techos y las metas son objetivos, y ninguno habla en porcentajes. Un presupuesto dice quedan 124 € hasta que pasas el límite, y solo entonces dice 38 € de más, en rojo."
      ),
      points: [
        t(
          "One colour the whole way — no traffic-light anxiety at 71%",
          "Un solo color todo el recorrido — sin semáforos que alarmen al 71 %"
        ),
        t(
          "A notice the moment a purchase pushes an envelope past its limit",
          "Un aviso en cuanto una compra pasa un sobre de su límite"
        ),
        t(
          "Savings goals get their own view, where full is a good thing",
          "Las metas de ahorro tienen su propia vista, donde llenar es bueno"
        ),
      ],
      screen: <BudgetDemoScreen />,
      screenLabel: t(
        "The Budget screen: six trackers showing what is left, with Dining already over its limit.",
        "La pantalla de Presupuesto: seis presupuestos con lo que queda, y Comidas ya pasado de su límite."
      ),
      ground: "ink" as const,
      flip: true,
    },
    {
      id: "wealth",
      index: "03",
      eyebrow: t("Net worth", "Patrimonio"),
      title: t(
        "Everything you own, minus what you owe.",
        "Todo lo que tienes, menos lo que debes."
      ),
      body: t(
        "Accounts, savings, investments, money you lent and your debts, resolved into a single net-worth figure with the month's change beside it. If it is a balance, it lives here.",
        "Cuentas, ahorros, inversiones, dinero prestado y deudas, resueltos en una sola cifra de patrimonio con el cambio del mes al lado. Si es un saldo, vive aquí."
      ),
      points: [
        t(
          "Five buckets, each opening to its own page",
          "Cinco bloques, cada uno con su propia página"
        ),
        t(
          "A by-currency split for money held in more than one place",
          "Un desglose por moneda para el dinero repartido en varios sitios"
        ),
        t(
          "Loans and liabilities tracked down to the payment",
          "Préstamos y deudas seguidos hasta cada pago"
        ),
      ],
      screen: <WealthDemoScreen />,
      screenLabel: t(
        "The Patrimonio screen: a net worth of €48,120.65 broken into accounts, savings, investments, money lent and debts.",
        "La pantalla de Patrimonio: 48.120,65 € desglosados en cuentas, ahorros, inversiones, dinero prestado y deudas."
      ),
      ground: "white" as const,
      flip: false,
    },
    {
      id: "insights",
      index: "04",
      eyebrow: t("Insights", "Análisis"),
      title: t("Where it actually went.", "En qué se fue de verdad."),
      body: t(
        "Twelve months of spending, the days inside the current one, and every category ranked. Tap a bar and land on the movements behind it — the chart is a way in, not a picture.",
        "Doce meses de gasto, los días dentro del mes actual y cada categoría ordenada. Toca una barra y caes en los movimientos que hay detrás — el gráfico es una entrada, no una imagen."
      ),
      points: [
        t(
          "A calendar view for any day you want to inspect",
          "Una vista de calendario para cualquier día que quieras mirar"
        ),
        t(
          "Envelope utilisation and the months that broke pattern",
          "Uso de cada sobre y los meses que rompieron el patrón"
        ),
        t(
          "A monthly report you can read in under a minute",
          "Un informe mensual que se lee en menos de un minuto"
        ),
      ],
      screen: <InsightsDemoScreen />,
      screenLabel: t(
        "The Insights screen: twelve months of spending as bars, with every category ranked underneath.",
        "La pantalla de Análisis: doce meses de gasto en barras, con cada categoría ordenada debajo."
      ),
      ground: "lemon" as const,
      flip: true,
    },
  ];

  return (
    <StaticCurrencyProvider baseCurrency="EUR">
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-40 bg-ink">
          {/* On a phone this row is exactly the brand and the two doors. The
              wordmark and the language chip drop out rather than push the
              account buttons off the viewport. */}
          <div className="mx-auto flex h-18 w-full max-w-[74rem] items-center gap-3 px-5 sm:gap-6 sm:px-7">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 text-white"
            >
              <Image
                src="/icons/budget-expense-app-icon.png"
                alt="Budget &amp; Expense"
                width={30}
                height={30}
                className="rounded-lg"
                priority
              />
              <span className="hidden text-body font-bold sm:inline">
                Budget &amp; Expense
              </span>
            </Link>
            <span className="flex-1" />
            <LanguageSwitch className="hidden border-white/20 bg-transparent text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex" />
            <Link
              href="/login"
              className={cn(quietPill, quietSize.sm, quietTone.ink)}
            >
              {t("Log in", "Entrar")}
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              {t("Create account", "Crear cuenta")}
            </Link>
          </div>
        </header>

        <main className="flex-1">
          {/* HERO — short on purpose. The tour below does the explaining. */}
          <section className="up-chrome overflow-hidden pt-12 pb-14 text-center sm:pt-16">
            <div className="mx-auto w-full max-w-[74rem] px-5 sm:px-7">
              <p className="label-caps text-white/50">
                {t(
                  "Money, clearly · Tu dinero, claro",
                  "Tu dinero, claro · Money, clearly"
                )}
              </p>
              <h1 className="landing-display mx-auto mt-4 max-w-[17ch] font-extrabold text-white">
                {t(
                  "Four screens. The whole month.",
                  "Cuatro pantallas. Todo el mes."
                )}
              </h1>
              <p className="mx-auto mt-4 max-w-[46ch] text-base text-white/65 sm:text-lg">
                {t(
                  "Take the tour before you sign up — this is the actual app, section by section.",
                  "Haz el recorrido antes de registrarte — esta es la aplicación real, sección por sección."
                )}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                  {t("Create your account", "Crea tu cuenta")}
                </Link>
                <Link
                  href="/login"
                  className={cn(quietPill, quietSize.lg, quietTone.ink)}
                >
                  {t("Log in", "Entrar")}
                </Link>
              </div>
            </div>

            {/* Desktop only. Shrunk to phone width the browser frame is
                unreadable, and putting the Home phone here instead would
                repeat the screen that section 01 opens with two scrolls
                later — so on a phone the tour simply starts sooner. */}
            <div className="mt-11 hidden justify-center px-5 md:flex">
              <BrowserFrame
                scale={0.62}
                label={t(
                  "The app on a desktop: an ink sidebar, the available balance, recent movements and trackers.",
                  "La aplicación en escritorio: barra lateral oscura, saldo disponible, movimientos recientes y presupuestos."
                )}
              >
                <DesktopDemoScreen />
              </BrowserFrame>
            </div>
          </section>

          {/* Section rail. Anchors only — it never leaves the page. */}
          <nav
            aria-label={t("Product tour", "Recorrido del producto")}
            className="sticky top-18 z-30 border-b border-border bg-card"
          >
            <div className="mx-auto flex w-full max-w-[74rem] items-center gap-6 overflow-x-auto px-5 py-4 sm:px-7">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="shrink-0 text-caption font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.index} {section.eyebrow}
                </a>
              ))}
              <span className="flex-1" />
              <Link
                href="/login"
                className="hidden shrink-0 text-caption font-semibold text-primary sm:block"
              >
                {t("Log in", "Entrar")} →
              </Link>
            </div>
          </nav>

          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={cn(
                "scroll-mt-32 px-5 py-16 sm:px-7 lg:py-20",
                section.ground === "ink" && "up-canvas",
                section.ground === "lemon" && "bg-lemon text-ink",
                section.ground === "white" && "bg-card text-foreground"
              )}
            >
              <div className="mx-auto grid w-full max-w-[74rem] items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={cn(section.flip && "lg:order-2")}>
                  <p
                    className={cn(
                      "label-caps",
                      section.ground === "lemon"
                        ? "text-coral-deep"
                        : "text-primary"
                    )}
                  >
                    {section.index} — {section.eyebrow}
                  </p>
                  <h2 className="landing-title mt-3 max-w-[15ch] font-extrabold">
                    {section.title}
                  </h2>
                  <p
                    className={cn(
                      "mt-4 max-w-[46ch] text-base sm:text-lg",
                      section.ground === "ink" && "text-white/65",
                      section.ground === "lemon" && "text-ink/70",
                      section.ground === "white" && "text-muted-foreground"
                    )}
                  >
                    {section.body}
                  </p>
                  <ul className="mt-6 grid gap-3">
                    {section.points.map((point) => (
                      <li key={point} className="flex gap-3 text-body">
                        <Check
                          className={cn(
                            "mt-0.5 h-4.5 w-4.5 shrink-0",
                            section.ground === "lemon"
                              ? "text-coral-deep"
                              : "text-primary"
                          )}
                          strokeWidth={2.4}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={cn(
                    "flex justify-center",
                    section.flip && "lg:order-1"
                  )}
                >
                  <PhoneFrame scale={0.68} label={section.screenLabel}>
                    {section.screen}
                  </PhoneFrame>
                </div>
              </div>
            </section>
          ))}

          <section className="bg-primary px-5 py-16 text-center text-ink sm:px-7 lg:py-20">
            <div className="mx-auto w-full max-w-[74rem]">
              <h2 className="landing-title mx-auto max-w-[17ch] font-extrabold">
                {t(
                  "That is the app. Take it for a month.",
                  "Esa es la aplicación. Pruébala un mes."
                )}
              </h2>
              <p className="mx-auto mt-4 max-w-[46ch] text-base text-ink/70 sm:text-lg">
                {t(
                  "Set your income, add a few fixed costs, and Home starts answering the question on day one. Skip the setup entirely if you would rather just start adding.",
                  "Pon tus ingresos, añade algunos gastos fijos y desde el primer día Inicio responde a la pregunta. Sáltate la configuración si prefieres empezar a añadir sin más."
                )}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  className={cn(inkPill, quietSize.lg)}
                >
                  {t("Create your account", "Crea tu cuenta")}
                </Link>
                <Link
                  href="/login"
                  className={cn(quietPill, quietSize.lg, quietTone.coral)}
                >
                  {t("Log in", "Entrar")}
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="up-chrome px-5 py-11 sm:px-7">
          <div className="mx-auto flex w-full max-w-[74rem] flex-wrap items-center gap-5 text-caption text-white/55">
            <span className="flex items-center gap-2.5">
              <Image
                src="/icons/budget-expense-app-icon.png"
                alt=""
                width={26}
                height={26}
                className="rounded-md"
              />
              <span className="font-bold text-white">Budget &amp; Expense</span>
            </span>
            <span className="flex-1" />
            <Link href="/login" className="hover:text-white">
              {t("Log in", "Entrar")}
            </Link>
            <Link href="/signup" className="hover:text-white">
              {t("Create account", "Crear cuenta")}
            </Link>
          </div>
        </footer>
      </div>
    </StaticCurrencyProvider>
  );
}
