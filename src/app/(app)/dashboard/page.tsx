import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Dashboard · Programming Study Tracker" };

export default async function DashboardPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <section aria-labelledby="active-goals-heading" className="rounded-xl border border-dashed p-8">
        <h2 id="active-goals-heading" className="font-semibold">No active goals yet</h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
          Your active goals and this week&apos;s study activity will appear here once you create topics and goals.
        </p>
      </section>
    </div>
  );
}
