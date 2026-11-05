// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { activities } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { getWeekSummary, listActiveGoalProgress } from "@/features/dashboard/queries";
import { changeGoalStatus, createGoal } from "@/features/goals/mutations";
import { createProject } from "@/features/projects/mutations";
import { listProjects } from "@/features/projects/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let topicId: string;
const week = { start: "2026-10-26", end: "2026-11-01" };

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const goal = async (scope: UserScope, title: string, topic = topicId) => expectOk(await createGoal(scope, {
  topicId: topic, title, description: null, definitionOfDone: "Done", targetDate: null, status: "active",
})).id;
const log = (userId: string, goalId: string, occurredOn: string, minutes: number | null, description = "Studied") =>
  database.db.insert(activities).values({ userId, goalId, type: "reading", description, occurredOn, minutes });

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice" };
  bob = { db: database.db, userId: "bob" };
  await ensureProfile(database.db, "alice", null);
  await ensureProfile(database.db, "bob", null);
  topicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
});
afterEach(async () => { await database.close(); });

test("active goals show their latest activity and this week's progress", async () => {
  const forms = await goal(alice, "Forms");
  const hooks = await goal(alice, "Hooks");
  const parked = await goal(alice, "Parked");
  await log("alice", forms, "2026-10-23", 60, "Last week");
  await log("alice", forms, "2026-10-27", 30, "Older this week");
  await log("alice", forms, "2026-10-29", null, "Newest");
  await log("alice", parked, "2026-10-28", 10);
  expectOk(await changeGoalStatus(alice, parked, "planned"));

  expect(await listActiveGoalProgress(alice, week)).toEqual([
    {
      id: forms, title: "Forms", topicName: "React",
      latestActivity: { type: "reading", description: "Newest", occurredOn: "2026-10-29" },
      weekActivityCount: 2, weekMinutes: 30,
    },
    { id: hooks, title: "Hooks", topicName: "React", latestActivity: null, weekActivityCount: 0, weekMinutes: 0 },
  ]);
});

test("the week summary counts every goal but only this week and only timed minutes", async () => {
  const forms = await goal(alice, "Forms");
  const hooks = await goal(alice, "Hooks");
  await log("alice", forms, "2026-10-26", 45);
  await log("alice", hooks, "2026-11-01", null);
  await log("alice", hooks, "2026-11-02", 120);
  await log("alice", hooks, "2026-10-25", 120);

  expect(await getWeekSummary(alice, week)).toEqual({ ...week, activityCount: 2, totalMinutes: 45, untimedCount: 1 });
});

test("dashboard data is scoped to the owner", async () => {
  const forms = await goal(alice, "Forms");
  await log("alice", forms, "2026-10-27", 30);
  expectOk(await createProject(alice, { title: "Lab", repoUrl: "https://github.com/a/lab", liveUrl: null, description: null }));

  expect(await listActiveGoalProgress(bob, week)).toEqual([]);
  expect(await getWeekSummary(bob, week)).toEqual({ ...week, activityCount: 0, totalMinutes: 0, untimedCount: 0 });
  expect(await listProjects(bob, { limit: 4 })).toEqual([]);
});

test("recent projects are limited and ordered by latest activity", async () => {
  const forms = await goal(alice, "Forms");
  const ids: string[] = [];
  for (const title of ["One", "Two", "Three", "Four", "Five"]) {
    ids.push(expectOk(await createProject(alice, { title, repoUrl: "https://github.com/a/b", liveUrl: null, description: null })).id);
  }
  await database.db.insert(activities).values({
    userId: "alice", goalId: forms, type: "project", projectId: ids[0], description: "Built", occurredOn: "2026-10-28",
  });
  const recent = await listProjects(alice, { limit: 4 });
  expect(recent).toHaveLength(4);
  expect(recent[0].title).toBe("One");
});
