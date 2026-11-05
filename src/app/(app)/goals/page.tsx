import type { Metadata } from "next";
import Link from "next/link";
import { GoalList } from "@/features/goals/components/goal-list";
import { listGoals } from "@/features/goals/queries";
import { goalStatusLabels } from "@/features/goals/rules";
import { goalStatusSchema, type GoalStatus } from "@/features/goals/schemas";
import { requireScope } from "@/lib/auth/scope";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Goals · Programming Study Tracker" };

const filters: (GoalStatus | "all")[] = ["all", "active", "planned", "completed", "archived"];

export default async function GoalsPage({ searchParams }: PageProps<"/goals">) {
  const parsed = goalStatusSchema.safeParse((await searchParams).status);
  const status = parsed.success ? parsed.data : "all";
  const goals = await listGoals(await requireScope());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
        <Link href="/goals/new" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none">
          New goal
        </Link>
      </div>
      <nav aria-label="Filter goals by status">
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const current = filter === status;
            const count = filter === "all" ? goals.length : goals.filter((goal) => goal.status === filter).length;
            return (
              <li key={filter}>
                <Link
                  href={filter === "all" ? "/goals" : `/goals?status=${filter}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-sm",
                    current ? "border-primary bg-secondary font-semibold underline underline-offset-4" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filter === "all" ? "All" : goalStatusLabels[filter]} ({count})
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <GoalList goals={goals} status={status} />
    </div>
  );
}
