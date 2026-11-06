// @vitest-environment node
import { afterEach, beforeEach, expect, test } from "vitest";
import { activities } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { createGoal } from "@/features/goals/mutations";
import { createProject } from "@/features/projects/mutations";
import { getWeeklyReview } from "@/features/review/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
const week = { start: "2026-10-26", end: "2026-11-01" };

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice" };
  bob = { db: database.db, userId: "bob" };
  await ensureProfile(database.db, "alice", null);
  await ensureProfile(database.db, "bob", null);
});
afterEach(async () => { await database.close(); });

test("the review groups the week's activities by goal, with projects and idle goals", async () => {
  const topicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
  const goal = async (title: string) => expectOk(await createGoal(alice, {
    topicId, title, description: null, definitionOfDone: "Done", targetDate: null, status: "active",
  })).id;
  const forms = await goal("Forms");
  const hooks = await goal("Hooks");
  const idle = await goal("Idle");
  const projectId = expectOk(await createProject(alice, { title: "Lab", repoUrl: "https://github.com/a/lab", liveUrl: null, description: null })).id;
  const base = { userId: "alice", description: "Studied" };
  await database.db.insert(activities).values([
    { ...base, goalId: forms, type: "reading", occurredOn: "2026-10-26", minutes: 30 },
    { ...base, goalId: forms, type: "project", projectId, occurredOn: "2026-11-01", minutes: 60 },
    { ...base, goalId: hooks, type: "video", occurredOn: "2026-10-28", minutes: null },
    { ...base, goalId: idle, type: "other", occurredOn: "2026-10-25", minutes: 500 },
    { ...base, goalId: idle, type: "other", occurredOn: "2026-11-02", minutes: 500 },
  ]);

  const review = await getWeeklyReview(alice, week);
  expect(review).toMatchObject({ totalMinutes: 90, activityCount: 3 });
  expect(review.goals.map((item) => [item.title, item.totalMinutes, item.activities.length])).toEqual([["Forms", 90, 2], ["Hooks", 0, 1]]);
  expect(review.goals[0].activities[0]).toMatchObject({ occurredOn: "2026-11-01", projectTitle: "Lab" });
  expect(review.projects).toEqual([{ id: projectId, title: "Lab", activityCount: 1, totalMinutes: 60 }]);
  expect(review.idleGoals.map((item) => item.title)).toEqual(["Idle"]);

  expect(await getWeeklyReview(bob, week)).toMatchObject({ totalMinutes: 0, activityCount: 0, goals: [], projects: [], idleGoals: [] });
});
