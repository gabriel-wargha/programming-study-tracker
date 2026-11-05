"use client";

import "./globals.css";

/** Replaces the root layout when it fails, so it brings its own html and body. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center px-4">
        <main role="alert" className="max-w-xl rounded-xl border bg-card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The app couldn&apos;t load. Your saved data is safe.</p>
          <button type="button" onClick={() => retry()} className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
