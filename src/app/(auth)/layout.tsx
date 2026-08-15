import { LanguageSwitch } from "@/components/shared/language-switch";
import { AuthStory } from "@/components/auth/auth-story";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-coral text-ink">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20">
        <LanguageSwitch className="border-ink/12 bg-ink text-white hover:bg-ink-2 hover:text-white" />
      </div>
      <div className="mx-auto grid min-h-dvh max-w-[1440px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
        <AuthStory />
        <section className="flex items-end bg-ink lg:items-center lg:px-12 lg:py-10">
          <div className="w-full rounded-t-2xl bg-white px-5 py-7 sm:px-8 lg:rounded-2xl lg:px-9 lg:py-9">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
