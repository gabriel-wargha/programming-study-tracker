import Link from "next/link";
import type { TopicSummary } from "@/features/topics/schemas";

export function TopicList({ topics }: { topics: TopicSummary[] }) {
  if (!topics.length) return <div className="rounded-xl border border-dashed p-8"><h2 className="font-semibold">No topics yet</h2><p className="mt-2 text-sm text-muted-foreground">Create a topic to group your programming goals.</p></div>;
  return (
    <ul aria-label="Topics" className="grid gap-4 sm:grid-cols-2">
      {topics.map((topic) => <li key={topic.id} className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-semibold"><Link href={`/topics/${topic.id}`} className="rounded-sm hover:underline">{topic.name}</Link></h2>
          {topic.archived && <span className="rounded-full border px-3 py-1 text-xs">Archived</span>}
        </div>
        {topic.description && <p className="mt-3 text-sm leading-6 whitespace-pre-wrap wrap-break-word text-muted-foreground">{topic.description}</p>}
        <p className="mt-4 text-xs text-muted-foreground">{topic.goalCount} {topic.goalCount === 1 ? "goal" : "goals"}</p>
      </li>)}
    </ul>
  );
}
