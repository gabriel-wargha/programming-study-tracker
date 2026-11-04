import type { ReactNode } from "react";
import { GoalList } from "@/features/goals/components/goal-list";
import type { GoalSummary } from "@/features/goals/schemas";
import type { TopicSummary } from "@/features/topics/schemas";

export function TopicDetail({ topic, goals, children }: { topic: TopicSummary; goals: GoalSummary[]; children?: ReactNode }) {
  return (
    <article className="space-y-8">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-4"><h1 className="text-3xl font-semibold tracking-tight wrap-break-word">{topic.name}</h1>{topic.archived && <span className="rounded-full border px-3 py-1 text-sm">Archived</span>}</div>
        {topic.description && <p className="mt-4 max-w-2xl leading-7 whitespace-pre-wrap wrap-break-word text-muted-foreground">{topic.description}</p>}
      </header>
      <section aria-labelledby="topic-goals"><h2 id="topic-goals" className="mb-4 text-xl font-semibold">Goals</h2><GoalList goals={goals} /></section>
      {children}
    </article>
  );
}
