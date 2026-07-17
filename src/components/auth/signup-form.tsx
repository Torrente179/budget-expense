"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const appOrigin =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const emailRedirectTo = `${appOrigin.replace(/\/$/, "")}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <span className="text-lg font-bold text-primary">B</span>
        </div>
        <CardTitle className="text-xl tracking-tight">
          {t("Create an account", "Crear una cuenta")}
        </CardTitle>
        <CardDescription>
          {t(
            "Start tracking your expenses and budgets",
            "Empieza a registrar tus gastos y presupuestos"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t("Name", "Nombre")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("Your name", "Tu nombre")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email", "Correo")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("Password", "Contraseña")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("Min 6 characters", "Mínimo 6 caracteres")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Create account", "Crear cuenta")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("Already have an account?", "¿Ya tienes una cuenta?")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("Log in", "Iniciar sesión")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
