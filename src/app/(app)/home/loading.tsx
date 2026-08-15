import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
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
  );
}
