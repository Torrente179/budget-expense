import { Skeleton } from "@/components/ui/skeleton";

export default function MovementsLoading() {
  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/8 bg-ink px-4 pt-[env(safe-area-inset-top)] text-white sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
        <div className="flex min-h-14 items-center gap-3 py-2">
          <Skeleton className="h-11 w-11 rounded-full bg-white/10 md:hidden" />
          <Skeleton className="h-5 w-28 bg-white/10" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-11 w-11 rounded-full bg-white/10 md:h-9 md:w-9" />
            <Skeleton className="h-11 w-11 rounded-full bg-white/10 md:h-9 md:w-20" />
          </div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
          <Skeleton className="h-11 w-52 bg-white/10" />
          <Skeleton className="h-14 w-60 rounded-lg bg-white/10 md:h-10" />
        </div>
      </header>
      <div className="-mx-4 sm:-mx-5 md:mx-0">
        <div className="flex h-52 items-center justify-center bg-ink md:rounded-xl">
          <Skeleton className="h-12 w-48 bg-white/10" />
        </div>
        <div className="bg-white md:mt-4 md:overflow-hidden md:rounded-xl">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-14 rounded-none border-b border-border bg-muted/70"
            />
          ))}
        </div>
      </div>
    </>
  );
}
