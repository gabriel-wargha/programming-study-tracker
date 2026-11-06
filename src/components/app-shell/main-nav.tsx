"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderGit2, Layers, LayoutDashboard, Settings, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Sections are added here as each phase builds its routes. Phones show these as a bottom tab bar, so keep five or fewer.
export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** One nav: a bottom tab bar on phones and a sidebar list from the `lg` breakpoint. */
export function MainNav({ items = mainNavItems }: { items?: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:static lg:border-t-0 lg:bg-transparent lg:pb-0">
      <ul className="grid grid-cols-5 lg:flex lg:flex-col lg:gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-offset-[-2px]",
                  "lg:min-h-10 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-sm",
                  current
                    ? "text-primary lg:bg-secondary lg:text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground lg:hover:bg-muted",
                )}
              >
                {/* The marker shows the current section without relying on color alone. */}
                <span aria-hidden="true" className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full bg-primary lg:top-2 lg:bottom-2 lg:left-0 lg:h-auto lg:w-0.5",
                  current ? "opacity-100" : "opacity-0",
                )} />
                <Icon aria-hidden="true" className="size-5 lg:size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
