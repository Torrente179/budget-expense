import { Skeleton } from "@/components/ui/skeleton";

export default function MovementsLoading() {
  return (
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
  );
}
