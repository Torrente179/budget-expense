import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Budget Tracker",
};

export default function LoginPage() {
  return <LoginForm />;
}
