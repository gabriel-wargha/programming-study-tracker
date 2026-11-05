import type { ReactNode } from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";

/** A link that leaves the app. It opens in a new tab without sharing the referrer. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium break-all text-primary underline underline-offset-4">
      {children}
      <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
