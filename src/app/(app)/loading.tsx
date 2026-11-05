/** Shown while a page's data loads, for example while the database wakes up. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border bg-muted/60" />)}
      </div>
    </div>
  );
}
