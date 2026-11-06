import type { Metadata } from "next";
import { Panel, PageHeader } from "@/components/page-header";
import { createTopicAction } from "@/features/topics/actions";
import { TopicForm } from "@/features/topics/components/topic-form";
import { TopicList } from "@/features/topics/components/topic-list";
import { listTopics } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Topics · Programming Study Tracker" };

export default async function TopicsPage() {
  const topics = await listTopics(await requireScope());

  return (
    <>
      <PageHeader title="Topics" description="Group your goals by subject, such as React or SQL." />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Your topics">
          <TopicList topics={topics} />
        </section>
        <Panel title="New topic" id="new-topic-heading" className="h-fit">
          <TopicForm action={createTopicAction} />
        </Panel>
      </div>
    </>
  );
}
