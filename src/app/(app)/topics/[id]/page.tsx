import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { Panel } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { addConfidenceRatingAction } from "@/features/confidence/actions";
import { ConfidenceForm } from "@/features/confidence/components/confidence-form";
import { ConfidenceHistory } from "@/features/confidence/components/confidence-history";
import { listConfidenceRatings } from "@/features/confidence/queries";
import { listActiveGoals, listGoals } from "@/features/goals/queries";
import { archiveTopicAction, updateTopicAction } from "@/features/topics/actions";
import { ArchiveTopicForm } from "@/features/topics/components/archive-topic-form";
import { TopicDetail } from "@/features/topics/components/topic-detail";
import { TopicForm } from "@/features/topics/components/topic-form";
import { getTopic } from "@/features/topics/queries";
import { createResourceAction, deleteResourceAction, updateResourceAction } from "@/features/resources/actions";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { ResourceLibrary } from "@/features/resources/components/resource-library";
import { listTopicResources } from "@/features/resources/queries";
import { PrerequisiteWarning } from "@/features/roadmap/components/prerequisite-warning";
import { listUnfinishedPrerequisites } from "@/features/roadmap/queries";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";

export const metadata: Metadata = { title: "Topic · Programming Study Tracker" };

export default async function TopicPage({ params }: PageProps<"/topics/[id]">) {
  const { id } = await params;
  const scope = await requireScope();
  const topic = await getTopic(scope, id);
  if (!topic) notFound();
  const [goals, activeGoals, ratings, { timeZone }, resources, unfinished] = await Promise.all([
    listGoals(scope, { topicId: topic.id }),
    listActiveGoals(scope, { topicId: topic.id }),
    listConfidenceRatings(scope, topic.id),
    getOwnerCalendar(),
    listTopicResources(scope, topic.id),
    listUnfinishedPrerequisites(scope, topic.id),
  ]);

  return (
    <TopicDetail
      topic={topic}
      goals={goals}
      actions={!topic.archived && <Button asChild><Link href={`/goals/new?topic=${topic.id}`}>Add a goal to this topic</Link></Button>}
      aside={<>
        <Panel title="Rate your confidence" id="rate-confidence-heading">
          <ConfidenceForm action={addConfidenceRatingAction} topicId={topic.id} />
        </Panel>
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
      notice={<PrerequisiteWarning prerequisites={unfinished} />}
    >
      <section aria-labelledby="topic-resources" className="space-y-3">
        <h2 id="topic-resources" className="text-lg font-semibold">Resources</h2>
        <ResourceLibrary resources={resources} updateAction={updateResourceAction} deleteAction={deleteResourceAction} />
        <Disclosure summary="Add a resource">
          <ResourceForm action={createResourceAction} topicId={topic.id} />
        </Disclosure>
      </section>
      <section aria-labelledby="topic-confidence">
        <h2 id="topic-confidence" className="mb-3 text-lg font-semibold">Confidence</h2>
        <ConfidenceHistory ratings={ratings} timeZone={timeZone} />
      </section>
    </TopicDetail>
  );
}
