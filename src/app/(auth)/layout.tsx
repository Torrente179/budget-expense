import { LanguageSwitch } from "@/components/shared/language-switch";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitch />
      </div>
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
