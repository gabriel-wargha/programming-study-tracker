import { expect, test } from "vitest";
import { buildRoadmap } from "@/features/roadmap/order";

const topic = (id: string) => ({ id, name: id.toUpperCase() });
const edge = (topicId: string, prerequisiteTopicId: string) => ({ topicId, prerequisiteTopicId });
const names = (stages: ReturnType<typeof buildRoadmap>) => stages.map((stage) => stage.topics.map((item) => item.name));

test("topics come after all of their prerequisites", () => {
  const topics = ["next", "react", "js", "css"].map(topic);
  const edges = [edge("react", "js"), edge("next", "react"), edge("next", "css")];
  expect(names(buildRoadmap(topics, edges, topics, new Set()))).toEqual([["CSS", "JS"], ["REACT"], ["NEXT"]]);
});

test("a topic's stage uses its longest prerequisite chain", () => {
  const topics = ["a", "b", "c"].map(topic);
  const edges = [edge("c", "a"), edge("c", "b"), edge("b", "a")];
  expect(names(buildRoadmap(topics, edges, topics, new Set()))).toEqual([["A"], ["B"], ["C"]]);
});

test("unfinished prerequisites are counted for the warning", () => {
  const topics = ["a", "b", "c"].map(topic);
  const edges = [edge("c", "a"), edge("c", "b")];
  const stages = buildRoadmap(topics, edges, topics, new Set(["a"]));
  const c = stages[1].topics[0];
  expect(c.unfinishedCount).toBe(1);
  expect(c.prerequisites).toEqual([{ id: "a", name: "A", finished: true }, { id: "b", name: "B", finished: false }]);
  expect(stages[0].topics.find((item) => item.id === "a")?.finished).toBe(true);
});

test("an archived prerequisite is listed but doesn't change the order", () => {
  const shown = [topic("b")];
  const stages = buildRoadmap(shown, [edge("b", "old")], [...shown, topic("old")], new Set());
  expect(stages).toHaveLength(1);
  expect(stages[0].stage).toBe(0);
  expect(stages[0].topics[0].prerequisites[0].name).toBe("OLD");
});

test("no topics means no stages", () => {
  expect(buildRoadmap([], [], [], new Set())).toEqual([]);
});
