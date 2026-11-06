import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** The title block at the top of every app page. */
export function PageHeader({ title, description, back, actions, meta }: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-8 space-y-3">
      {back && (
        <Link href={back.href} className="-ml-1 inline-flex max-w-full items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{back.label}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight wrap-break-word sm:text-[2rem]">{title}</h1>
          {description && <div className="max-w-[65ch] text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">{meta}</div>}
    </header>
  );
}

/** A labelled region with a quiet heading; the default surface for page content. */
export function Panel({ title, id, description, children, className = "" }: {
  title: string;
  id: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`rounded-lg border bg-card ${className}`}>
      <div className="border-b px-5 py-3.5">
        <h2 id={id} className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A dashed box for empty lists: says what's missing and what to do. */
export function EmptyState({ title, children, headingLevel = 2 }: { title: string; children?: ReactNode; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="rounded-lg border border-dashed bg-subtle px-6 py-8">
      <Heading className="font-semibold">{title}</Heading>
      {children && <div className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
}
