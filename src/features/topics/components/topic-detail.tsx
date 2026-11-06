import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { GoalList } from "@/features/goals/components/goal-list";
import type { GoalSummary } from "@/features/goals/schemas";
import type { TopicSummary } from "@/features/topics/schemas";

export function TopicDetail({ topic, goals, actions, aside, notice, children }: {
  topic: TopicSummary;
  goals: GoalSummary[];
  actions?: ReactNode;
  aside?: ReactNode;
  notice?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article>
      <PageHeader
        back={{ href: "/topics", label: "Topics" }}
        title={topic.name}
        description={topic.description && <p className="whitespace-pre-wrap wrap-break-word">{topic.description}</p>}
        actions={actions}
        meta={topic.archived && <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">Archived</span>}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          {notice}
          <section aria-labelledby="topic-goals">
            <h2 id="topic-goals" className="mb-3 text-lg font-semibold">Goals</h2>
            <GoalList goals={goals} />
          </section>
          {children}
        </div>
        {aside && <aside aria-label="Topic settings" className="space-y-4 lg:sticky lg:top-10 lg:self-start">{aside}</aside>}
      </div>
    </article>
  );
}
