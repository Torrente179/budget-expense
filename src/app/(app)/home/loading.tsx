import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/8 bg-ink px-4 pt-[env(safe-area-inset-top)] text-white sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
        <div className="flex min-h-14 items-center gap-3 py-2">
          <Skeleton className="h-11 w-11 rounded-full bg-white/10 md:hidden" />
          <Skeleton className="h-5 w-16 bg-white/10" />
          <div className="ml-auto hidden gap-2 md:flex">
            <Skeleton className="h-9 w-24 rounded-full bg-white/10" />
            <Skeleton className="h-9 w-16 rounded-full bg-white/10" />
            <Skeleton className="h-9 w-20 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="flex justify-center pb-3 sm:justify-end">
          <Skeleton className="h-14 w-60 rounded-lg bg-white/10 md:h-10" />
        </div>
      </header>
      <div className="grid min-w-0 items-start lg:grid-cols-[minmax(0,3fr)_minmax(19rem,2fr)] lg:gap-5">
        <div className="-mx-4 sm:-mx-5 lg:mx-0">
          <div className="flex h-72 items-center justify-center bg-ink lg:rounded-t-xl">
            <Skeleton className="h-12 w-48 bg-white/10" />
          </div>
          <div className="bg-white lg:rounded-b-xl">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 rounded-none border-b border-border bg-muted/70"
              />
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-4 lg:mt-0">
          <Skeleton className="h-52 rounded-xl bg-ink-2" />
          <Skeleton className="h-72 rounded-xl bg-white" />
        </div>
      </div>
    </>
  );
}
