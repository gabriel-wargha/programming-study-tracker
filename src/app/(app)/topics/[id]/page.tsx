import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listActiveGoals, listGoals } from "@/features/goals/queries";
import { archiveTopicAction, updateTopicAction } from "@/features/topics/actions";
import { ArchiveTopicForm } from "@/features/topics/components/archive-topic-form";
import { TopicDetail } from "@/features/topics/components/topic-detail";
import { TopicForm } from "@/features/topics/components/topic-form";
import { getTopic } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Topic · Programming Study Tracker" };

export default async function TopicPage({ params }: PageProps<"/topics/[id]">) {
  const { id } = await params;
  const scope = await requireScope();
  const topic = await getTopic(scope, id);
  if (!topic) notFound();
  const [goals, activeGoals] = await Promise.all([
    listGoals(scope, { topicId: topic.id }),
    listActiveGoals(scope, { topicId: topic.id }),
  ]);

  return (
    <TopicDetail topic={topic} goals={goals}>
      {!topic.archived && (
        <p>
          <Link href={`/goals/new?topic=${topic.id}`} className="font-medium text-primary underline underline-offset-4">
            Add a goal to this topic
          </Link>
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="edit-topic-heading" className="rounded-xl border bg-card p-6">
          <h2 id="edit-topic-heading" className="mb-4 text-lg font-semibold">Edit topic</h2>
          <TopicForm
            key={`${topic.name}\n${topic.description ?? ""}`}
            action={updateTopicAction}
            initialValues={{ id: topic.id, name: topic.name, description: topic.description ?? "" }}
          />
        </section>
        {!topic.archived && (
          <section aria-labelledby="archive-topic-heading" className="h-fit rounded-xl border bg-card p-6">
            <h2 id="archive-topic-heading" className="mb-2 text-lg font-semibold">Archive topic</h2>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              Archived topics keep their goals and history but can&apos;t receive new or active goals.
            </p>
            <ArchiveTopicForm action={archiveTopicAction} topicId={topic.id} activeGoals={activeGoals} />
          </section>
        )}
      </div>
    </TopicDetail>
  );
}
