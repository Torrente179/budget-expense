import type { ReactNode } from "react";
import { SiteBrand } from "@/components/layout/site-brand";
import { cn } from "@/lib/utils";

interface OnboardingStoryShellProps {
  stepIndex: number;
  stepCount: number;
  progressLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

/**
 * The reusable presentation layer for onboarding. The live wizard owns all
 * state and writes; the private review route can render this same shell with
 * inert fixture content and no Supabase dependency.
 */
export function OnboardingStoryShell({
  stepIndex,
  stepCount,
  progressLabel,
  eyebrow,
  title,
  description,
  children,
  className,
}: OnboardingStoryShellProps) {
  return (
    <div
      className={cn(
        "-mx-4 -mt-3 min-h-dvh bg-coral text-ink sm:-mx-5 lg:-mx-8",
        className
      )}
    >
      <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col">
        <header className="px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <SiteBrand className="w-fit [&_.label-caps]:text-ink [&_span]:text-ink" />
            <span className="font-mono text-caption tabular-nums text-ink">
              {stepIndex + 1} / {stepCount}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={1}
            aria-valuemax={stepCount}
            aria-valuenow={stepIndex + 1}
            className="mt-4 flex gap-1.5"
          >
            {Array.from({ length: stepCount }, (_, index) => (
              <span
                key={index}
                aria-hidden
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-[var(--motion-standard)]",
                  index <= stepIndex ? "bg-ink" : "bg-ink/18"
                )}
              />
            ))}
          </div>
        </header>

        <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.78fr)]">
          <section className="flex flex-col justify-end px-6 pb-9 pt-10 sm:px-10 lg:justify-center lg:px-16 lg:py-14">
            <p className="label-caps text-ink">{eyebrow}</p>
            <h1 className="mt-4 max-w-[11ch] text-[clamp(3rem,7vw,6.5rem)] font-black uppercase leading-[0.9] tracking-[-0.075em]">
              <span className="bg-ink px-[0.08em] text-lemon [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                {title}
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium text-ink lg:text-lg">
              {description}
            </p>
          </section>

          <section className="flex items-end bg-ink lg:items-center lg:px-10 lg:py-10">
            <div className="w-full rounded-t-2xl bg-white px-5 py-6 sm:px-8 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:rounded-2xl lg:px-8 lg:py-8 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:ring-0 [&_[data-slot=card-content]]:px-0">
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
