export default function AppLoading() {
  return (
    <div className="space-y-4 py-4" role="status" aria-label="Loading page">
      <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
