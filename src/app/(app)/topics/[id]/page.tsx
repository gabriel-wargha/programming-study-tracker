import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { Panel } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
    <TopicDetail
      topic={topic}
      goals={goals}
      actions={!topic.archived && <Button asChild><Link href={`/goals/new?topic=${topic.id}`}>Add a goal to this topic</Link></Button>}
      aside={<>
        <Disclosure summary="Edit topic">
          <TopicForm
            key={`${topic.name}\n${topic.description ?? ""}`}
            action={updateTopicAction}
            initialValues={{ id: topic.id, name: topic.name, description: topic.description ?? "" }}
          />
        </Disclosure>
        {!topic.archived && (
          <Panel
            title="Archive topic"
            id="archive-topic-heading"
            description="Archived topics keep their goals and history but can't receive new or active goals."
          >
            <ArchiveTopicForm action={archiveTopicAction} topicId={topic.id} activeGoals={activeGoals} />
          </Panel>
        )}
      </>}
    />
  );
}
