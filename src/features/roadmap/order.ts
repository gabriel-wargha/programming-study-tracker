export type RoadmapTopic = { id: string; name: string };
export type RoadmapEdge = { topicId: string; prerequisiteTopicId: string };
export type RoadmapEntry = RoadmapTopic & {
  finished: boolean;
  prerequisites: (RoadmapTopic & { finished: boolean })[];
  unfinishedCount: number;
};
export type RoadmapStage = { stage: number; topics: RoadmapEntry[] };

/**
 * Groups topics into stages: each topic comes after all of its prerequisites.
 * The database rejects loops, so every topic gets a stage. Prerequisites outside
 * `topics` (archived topics) are listed but don't affect the order.
 */
export function buildRoadmap(topics: RoadmapTopic[], edges: RoadmapEdge[], allTopics: RoadmapTopic[], finishedIds: Set<string>): RoadmapStage[] {
  const shown = new Set(topics.map((topic) => topic.id));
  const names = new Map(allTopics.map((topic) => [topic.id, topic.name]));
  const prerequisitesOf = (id: string) => edges.filter((edge) => edge.topicId === id).map((edge) => edge.prerequisiteTopicId);

  const depth = new Map<string, number>();
  const depthOf = (id: string, seen: Set<string>): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (seen.has(id)) return 0; // defensive; loops can't be saved
    const next = new Set(seen).add(id);
    const value = prerequisitesOf(id).filter((other) => shown.has(other))
      .reduce((deepest, other) => Math.max(deepest, depthOf(other, next) + 1), 0);
    depth.set(id, value);
    return value;
  };

  const stages = new Map<number, RoadmapEntry[]>();
  for (const topic of topics) {
    const prerequisites = prerequisitesOf(topic.id)
      .map((id) => ({ id, name: names.get(id) ?? "Unknown topic", finished: finishedIds.has(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const stage = depthOf(topic.id, new Set());
    const entry = {
      ...topic,
      finished: finishedIds.has(topic.id),
      prerequisites,
      unfinishedCount: prerequisites.filter((item) => !item.finished).length,
    };
    stages.set(stage, [...(stages.get(stage) ?? []), entry]);
  }
  return [...stages.entries()].sort(([a], [b]) => a - b)
    .map(([stage, entries]) => ({ stage, topics: entries.sort((a, b) => a.name.localeCompare(b.name)) }));
}
