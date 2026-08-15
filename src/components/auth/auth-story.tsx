"use client";

import { SiteBrand } from "@/components/layout/site-brand";
import { useLocale } from "@/providers/locale-provider";

export function AuthStory() {
  const { t } = useLocale();

  return (
    <section className="flex min-h-[17rem] flex-col justify-between px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10 lg:min-h-dvh lg:px-16 lg:py-14">
      <SiteBrand className="w-fit [&_.label-caps]:text-ink/55 [&_span]:text-ink" />
      <div className="max-w-xl pt-16 lg:pt-0">
        <p className="label-caps mb-4 text-ink/55">
          {t("Money, clearly", "Tu dinero, claro")}
        </p>
        <h1 className="max-w-[12ch] text-[clamp(3rem,7vw,6.8rem)] font-black leading-[0.82] tracking-[-0.075em] text-lemon uppercase">
          {t("Own your next move.", "Haz tuyo el próximo paso.")}
        </h1>
        <p className="mt-6 max-w-md text-base font-medium text-ink/72 lg:text-lg">
          {t(
            "A private place for spending, plans, savings goals and the full picture of what you own.",
            "Un lugar privado para tus gastos, planes, metas de ahorro y todo lo que tienes."
          )}
        </p>
      </div>
    </section>
  );
}
