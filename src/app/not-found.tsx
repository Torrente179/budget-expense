import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-6 py-12 text-white">
      <section className="w-full max-w-lg text-center">
        <p className="money-hero">404</p>
        <p className="label-caps mt-4 text-white/50">Off the ledger</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          This page moved. / Esta página se movió.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/58">
          Your balances are untouched. Return to the main activity feed. /
          Tus saldos siguen intactos. Vuelve a la actividad principal.
        </p>
        <Link
          href="/home"
          className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-coral px-5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Home / Inicio
        </Link>
      </section>
    </main>
  );
}
