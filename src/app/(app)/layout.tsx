import Link from "next/link";
import { MainNav } from "@/components/app-shell/main-nav";
import { TimeZoneSync } from "@/components/app-shell/time-zone-sync";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh w-full flex-col lg:grid lg:grid-cols-[15rem_1fr]">
      <TimeZoneSync />
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-svh lg:flex-col lg:items-stretch lg:justify-start lg:gap-6 lg:border-r lg:border-b-0 lg:bg-card lg:px-4 lg:py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md font-semibold lg:px-2">
          <span aria-hidden="true" className="flex h-7 items-center rounded-md bg-foreground px-1.5 font-mono text-xs font-medium text-card">{"{}"}</span>
          <span className="text-sm leading-tight">Study Tracker</span>
        </Link>
        <MainNav />
        <p className="max-w-40 min-w-0 text-[0.6875rem] text-muted-foreground lg:mt-auto lg:max-w-none lg:px-2 lg:text-xs">
          {user.isLocalOwner ? (
            <span className="flex items-center gap-1.5 rounded-md border bg-subtle px-2 py-1 leading-snug">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-type-reading" />
              <span>Local owner · development only</span>
            </span>
          ) : (
            user.displayName
          )}
        </p>
      </header>
      <main id="main-content" tabIndex={-1} className="w-full max-w-5xl flex-1 px-4 pt-6 pb-28 focus:outline-none sm:px-8 lg:px-12 lg:pt-10 lg:pb-16">
        {children}
      </main>
    </div>
  );
}
