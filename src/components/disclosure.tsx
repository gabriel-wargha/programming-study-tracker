import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** A panel that stays folded until opened, for secondary forms such as editing. */
export function Disclosure({ summary, children, defaultOpen = false }: { summary: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-lg border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-5 text-sm font-semibold hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t p-5">{children}</div>
    </details>
  );
}
