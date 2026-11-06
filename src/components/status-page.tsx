import type { ReactNode } from "react";

/** A full-width message for not-found and error screens. */
export function StatusPage({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border bg-card p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">{children}</div>
      {actions && <div className="mt-6 flex flex-wrap items-center gap-4">{actions}</div>}
    </div>
  );
}
