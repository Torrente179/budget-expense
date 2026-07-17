import { Skeleton } from "@/components/ui/skeleton";

export default function MovementsLoading() {
  return (
    <div className="space-y-4 pt-6">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
