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
import { Loader2, Mail } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

function signupEmailRedirectTo() {
  const appOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${appOrigin.replace(/\/$/, "")}/auth/callback?next=/onboarding`;
}

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailRedirectTo = signupEmailRedirectTo();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user with empty identities when the email is already
    // registered — no confirmation email is sent in that case.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError(
        t(
          "An account with this email already exists. Log in or reset your password.",
          "Ya existe una cuenta con este correo. Inicia sesión o restablece tu contraseña."
        )
      );
      setLoading(false);
      return;
    }

    // Confirm-email is enabled: no session until the user clicks the link.
    if (!data.session) {
      setPendingEmail(email.trim());
      setAwaitingConfirmation(true);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  async function handleResend() {
    if (!pendingEmail) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: signupEmailRedirectTo() },
      });
      if (resendError) {
        setError(resendError.message);
      }
    } finally {
      setResending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <Card className="border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl tracking-tight">
            {t("Check your email", "Revisa tu correo")}
          </CardTitle>
          <CardDescription>
            {t(
              `We sent a link to ${pendingEmail}. Open it, then you can finish setup.`,
              `Enviamos un enlace a ${pendingEmail}. Ábrelo y luego terminas la configuración.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <p className="text-center text-caption text-muted-foreground">
            {t(
              "Didn't get it? Check spam, or resend the email.",
              "¿No llegó? Revisa spam, o reenvía el correo."
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resending}
            onClick={handleResend}
          >
            {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("Resend confirmation email", "Reenviar correo de confirmación")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("Back to log in", "Volver a iniciar sesión")}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <span className="text-lg font-bold text-primary">B</span>
        </div>
        <CardTitle className="text-xl tracking-tight">
          {t("Create an account", "Crea tu cuenta")}
        </CardTitle>
        <CardDescription>
          {t(
            "For spending, budgets, and giving — in one place.",
            "Gastos, presupuestos y dar — todo en un solo sitio."
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
