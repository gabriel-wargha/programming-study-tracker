import { Code2 } from "lucide-react";
import Link from "next/link";
import { MainNav } from "@/components/app-shell/main-nav";
import { TimeZoneSync } from "@/components/app-shell/time-zone-sync";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 sm:px-8">
      <TimeZoneSync />
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b py-4">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-sm font-semibold">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 aria-hidden="true" className="size-5" />
          </span>
          <span className="text-sm leading-snug">Programming Study Tracker</span>
        </Link>
        <MainNav />
        <p className="text-sm text-muted-foreground">
          {user.isLocalOwner ? (
            <span className="rounded-full border px-3 py-1 text-xs">Local owner · development only</span>
          ) : (
            user.displayName
          )}
        </p>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 py-8 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
