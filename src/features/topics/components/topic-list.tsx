import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import type { TopicSummary } from "@/features/topics/schemas";

export function TopicList({ topics }: { topics: TopicSummary[] }) {
  if (!topics.length) {
    return <EmptyState title="No topics yet"><p>Create a topic to group your programming goals.</p></EmptyState>;
  }
  return (
    <ul aria-label="Topics" className="divide-y rounded-lg border bg-card">
      {topics.map((topic) => (
        <li key={topic.id} className="px-5 py-4 hover:bg-subtle">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-semibold wrap-break-word">
              <Link href={`/topics/${topic.id}`} className="rounded-sm hover:text-primary hover:underline">{topic.name}</Link>
            </h2>
            <p className="text-xs text-muted-foreground">
              <span className="tabular-nums">{topic.goalCount}</span> {topic.goalCount === 1 ? "goal" : "goals"}
              {topic.archived && <span className="ml-2 rounded-full border bg-muted px-2 py-0.5">Archived</span>}
            </p>
          </div>
          {topic.description && <p className="mt-1.5 line-clamp-2 max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">{topic.description}</p>}
        </li>
      ))}
    </ul>
  );
}
