export default function AppLoading() {
  return (
    <div className="-mx-4 min-h-[70dvh] bg-ink sm:-mx-5 md:mx-0 md:mt-4 md:overflow-hidden md:rounded-xl" role="status" aria-label="Loading page">
      <div className="space-y-4 px-4 pb-8 pt-20 text-center sm:px-5">
        <div className="mx-auto h-12 w-52 animate-pulse rounded-lg bg-white/10" />
        <div className="mx-auto h-3 w-32 animate-pulse rounded bg-white/8" />
      </div>
      <div className="rounded-t-2xl bg-white px-4 py-5 sm:px-5">
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
