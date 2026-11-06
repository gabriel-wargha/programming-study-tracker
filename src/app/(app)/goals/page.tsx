import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
    <>
      <PageHeader
        title="Goals"
        description="Small, focused goals, each with a clear finish line."
        actions={<Button asChild><Link href="/goals/new">New goal</Link></Button>}
      />
      <nav aria-label="Filter goals by status" className="mb-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="inline-flex min-w-max gap-1 rounded-lg border bg-card p-1">
          {filters.map((filter) => {
            const current = filter === status;
            const count = filter === "all" ? goals.length : goals.filter((goal) => goal.status === filter).length;
            return (
              <li key={filter}>
                <Link
                  href={filter === "all" ? "/goals" : `/goals?status=${filter}`}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm",
                    current ? "bg-foreground font-medium text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {filter === "all" ? "All" : goalStatusLabels[filter]}
                  <span className={cn("tabular-nums text-xs", current ? "text-card/70" : "text-muted-foreground")}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <GoalList goals={goals} status={status} />
    </>
  );
}
