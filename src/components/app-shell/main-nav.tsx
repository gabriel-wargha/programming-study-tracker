"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FolderGit2, Layers, LayoutDashboard, Menu, Route, Settings, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Sections are added here as each phase builds its routes.
// Phones show `primaryNavItems` as tabs, plus a More button for the rest: keep this list at four.
export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/review", label: "Review", icon: ClipboardList },
];
export const secondaryNavItems: NavItem[] = [
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/roadmap", label: "Roadmap", icon: Route },
  { href: "/settings", label: "Settings", icon: Settings },
];

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const itemClass = (current: boolean) => cn(
  "group relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-offset-[-2px]",
  "lg:min-h-10 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-sm",
  current ? "text-primary lg:bg-secondary lg:text-secondary-foreground" : "text-muted-foreground hover:text-foreground lg:hover:bg-muted",
);

/** The marker shows the current section without relying on color alone. */
function Marker({ current, inMenu = false }: { current: boolean; inMenu?: boolean }) {
  return <span aria-hidden="true" className={cn(
    "absolute top-0 h-0.5 w-8 rounded-full bg-primary lg:top-2 lg:bottom-2 lg:left-0 lg:h-auto lg:w-0.5",
    current ? "opacity-100" : "opacity-0",
    inMenu && "max-lg:hidden",
  )} />;
}

/** One nav: a bottom tab bar with a More menu on phones, and a sidebar list from the `lg` breakpoint. */
export function MainNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreCurrent = secondaryNavItems.some((item) => isCurrent(pathname, item.href));

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMoreOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [moreOpen]);

  const link = ({ href, label, icon: Icon }: NavItem, inMenu = false) => {
    const current = isCurrent(pathname, href);
    return (
      <li key={href}>
        <Link href={href} aria-current={current ? "page" : undefined} onClick={() => setMoreOpen(false)}
          className={cn(itemClass(current), inMenu && "min-h-12 flex-row justify-start gap-3 rounded-md px-3 text-sm")}>
          <Marker current={current} inMenu={inMenu} />
          <Icon aria-hidden="true" className="size-5 lg:size-4" />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:static lg:border-t-0 lg:bg-transparent lg:pb-0">
      <div className="relative lg:flex lg:flex-col lg:gap-0.5">
        <ul className="grid grid-cols-5 lg:flex lg:flex-col lg:gap-0.5">
          {primaryNavItems.map((item) => link(item))}
          <li className="lg:hidden">
            <button type="button" aria-expanded={moreOpen} aria-controls="more-nav" onClick={() => setMoreOpen((open) => !open)}
              className={cn(itemClass(moreCurrent || moreOpen), "w-full cursor-pointer")}>
              <Marker current={moreCurrent} />
              <Menu aria-hidden="true" className="size-5" />
              More
            </button>
          </li>
        </ul>
        {/* On phones this opens above the tab bar; on desktop it continues the sidebar list. */}
        <ul id="more-nav" className={cn(
          moreOpen ? "block" : "hidden",
          "absolute right-2 bottom-full mb-2 min-w-44 rounded-lg border bg-card p-1 shadow-lg",
          "lg:static lg:mb-0 lg:flex lg:min-w-0 lg:flex-col lg:gap-0.5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
        )}>
          {secondaryNavItems.map((item) => link(item, true))}
        </ul>
      </div>
    </nav>
  );
}
