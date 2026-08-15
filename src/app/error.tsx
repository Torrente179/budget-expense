"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";

export default function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] items-center justify-center bg-ink px-6 py-12 text-white">
      <section className="w-full max-w-lg text-center">
        <p className="label-caps text-white/45">
          {t("Something interrupted the view", "Algo interrumpió la vista")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {t("Your money data was not changed.", "Tus datos no cambiaron.")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/58">
          {t(
            "Try this screen again. If it keeps happening, return home and avoid repeating any financial action.",
            "Intenta abrir esta pantalla otra vez. Si continúa, vuelve al inicio y no repitas ninguna acción financiera."
          )}
        </p>
        <Button type="button" className="mt-7" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          {t("Try again", "Intentar de nuevo")}
        </Button>
      </section>
    </main>
  );
}
