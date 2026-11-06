import { goalStatusLabels } from "@/features/goals/rules";
import type { GoalStatus } from "@/features/goals/schemas";
import { cn } from "@/lib/utils";

const styles: Record<GoalStatus, { badge: string; dot: string }> = {
  active: { badge: "border-primary/30 bg-secondary text-secondary-foreground", dot: "bg-primary" },
  planned: { badge: "bg-card text-foreground", dot: "border border-muted-foreground bg-transparent" },
  completed: { badge: "border-type-reading/30 bg-type-reading/5 text-type-reading", dot: "bg-type-reading" },
  archived: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
};

/** The goal status as text with a shaped marker, so it never relies on color alone. */
export function GoalStatusBadge({ status, className }: { status: GoalStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status].badge, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", styles[status].dot)} />
      {goalStatusLabels[status]}
    </span>
  );
}
