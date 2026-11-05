import type { Metadata } from "next";
import { createTopicAction } from "@/features/topics/actions";
import { TopicForm } from "@/features/topics/components/topic-form";
import { TopicList } from "@/features/topics/components/topic-list";
import { listTopics } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Topics · Programming Study Tracker" };

export default async function TopicsPage() {
  const topics = await listTopics(await requireScope());

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="topics-heading">
        <h1 id="topics-heading" className="mb-6 text-3xl font-semibold tracking-tight">Topics</h1>
        <TopicList topics={topics} />
      </section>
      <section aria-labelledby="new-topic-heading" className="h-fit rounded-xl border bg-card p-6">
        <h2 id="new-topic-heading" className="mb-4 text-lg font-semibold">New topic</h2>
        <TopicForm action={createTopicAction} />
      </section>
    </div>
  );
}
