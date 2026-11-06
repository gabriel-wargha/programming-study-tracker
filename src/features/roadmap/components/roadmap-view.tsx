import Link from "next/link";
import { CircleCheck, Circle, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { AddPrerequisiteForm, RemovePrerequisiteForm } from "@/features/roadmap/components/prerequisite-forms";
import type { RoadmapEdge, RoadmapStage, RoadmapTopic } from "@/features/roadmap/order";
import type { PrerequisiteField } from "@/features/roadmap/schemas";
import type { FormAction } from "@/lib/forms/action-state";

type Input = { topicId: string; prerequisiteTopicId: string };

export function RoadmapView({ stages, options, edges, addAction, removeAction }: {
  stages: RoadmapStage[];
  options: RoadmapTopic[];
  edges: RoadmapEdge[];
  addAction: FormAction<PrerequisiteField, Input>;
  removeAction: FormAction<PrerequisiteField, Input>;
}) {
  if (!stages.length) {
    return (
      <EmptyState title="No topics yet">
        <p><Link href="/topics" className="font-medium text-primary underline underline-offset-4">Create a topic</Link> to start your roadmap.</p>
      </EmptyState>
    );
  }
  return (
    <ol aria-label="Learning stages" className="space-y-8">
      {stages.map((stage, index) => (
        <li key={stage.stage}>
          <section aria-labelledby={`stage-${stage.stage}`}>
            <h2 id={`stage-${stage.stage}`} className="mb-3 text-lg font-semibold">{index === 0 ? "Start here" : `Then, step ${index + 1}`}</h2>
            <ul className="divide-y rounded-lg border bg-card">
              {stage.topics.map((topic) => {
                const available = options.filter((option) => option.id !== topic.id
                  && !edges.some((edge) => edge.topicId === topic.id && edge.prerequisiteTopicId === option.id));
                return (
                  <li key={topic.id} className="space-y-3 px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-semibold wrap-break-word">
                        <Link href={`/topics/${topic.id}`} className="hover:text-primary hover:underline">{topic.name}</Link>
                      </h3>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        {topic.finished ? <CircleCheck aria-hidden="true" className="size-3.5 text-type-reading" /> : <Circle aria-hidden="true" className="size-3.5" />}
                        {topic.finished ? "Finished" : "Not finished"}
                      </span>
                    </div>
                    {topic.unfinishedCount > 0 && (
                      <p className="flex items-start gap-1.5 text-sm text-type-practice">
                        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                        {topic.unfinishedCount === 1 ? "1 prerequisite isn't finished yet." : `${topic.unfinishedCount} prerequisites aren't finished yet.`} You can still work on this topic.
                      </p>
                    )}
                    {topic.prerequisites.length > 0 && (
                      <ul aria-label={`Prerequisites of ${topic.name}`} className="flex flex-wrap gap-2">
                        {topic.prerequisites.map((prerequisite) => (
                          <li key={prerequisite.id} className="inline-flex items-center gap-1.5 rounded-md border bg-subtle py-0.5 pr-0.5 pl-2.5 text-sm">
                            {prerequisite.finished
                              ? <CircleCheck aria-hidden="true" className="size-3.5 text-type-reading" />
                              : <Circle aria-hidden="true" className="size-3.5 text-muted-foreground" />}
                            <span className="wrap-break-word">{prerequisite.name}</span>
                            <span className="sr-only">{prerequisite.finished ? "(finished)" : "(not finished)"}</span>
                            <RemovePrerequisiteForm action={removeAction} topic={topic} prerequisite={prerequisite} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {available.length > 0 && <AddPrerequisiteForm action={addAction} topic={topic} options={available} />}
                  </li>
                );
              })}
            </ul>
          </section>
        </li>
      ))}
    </ol>
  );
}
