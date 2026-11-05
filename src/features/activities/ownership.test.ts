// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { activities } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { deleteActivity, logActivities, updateActivity } from "@/features/activities/mutations";
import { listGoalActivities } from "@/features/activities/queries";
import { logActivitiesSchema } from "@/features/activities/schemas";
import { changeGoalStatus, createGoal } from "@/features/goals/mutations";
import { createProject, updateProject } from "@/features/projects/mutations";
import { getProject, listProjectGoals, listProjectOptions, listProjects } from "@/features/projects/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let aliceGoalId: string;
let aliceProjectId: string;
let aliceActivityId: string;
let bobGoalId: string;

const project = { title: "Form lab", repoUrl: "https://github.com/alice/form-lab", liveUrl: null, description: null };
const edit = { occurredOn: "2026-11-02", type: "reading" as const, description: "Changed", minutes: 5, projectId: null };

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function activeGoal(scope: UserScope, name: string) {
  const topicId = expectOk(await createTopic(scope, { name, description: null })).id;
  return expectOk(await createGoal(scope, {
    topicId, title: `${name} goal`, description: null, definitionOfDone: "Done", targetDate: null, status: "active",
  })).id;
}

const log = (goalId: string, raw: Record<string, unknown> = {}) => logActivitiesSchema.parse({
  goalId,
  occurredOn: "2026-11-03",
  entries: [{ type: "reading", description: "Read the docs", minutes: "30" }],
  projectId: "",
  newProject: { title: "", repoUrl: "", liveUrl: "", description: "" },
  ...raw,
});

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice" };
  bob = { db: database.db, userId: "bob" };
  await ensureProfile(database.db, "alice", null);
  await ensureProfile(database.db, "bob", null);
  aliceGoalId = await activeGoal(alice, "React");
  bobGoalId = await activeGoal(bob, "Go");
  aliceProjectId = expectOk(await createProject(alice, project)).id;
  expectOk(await logActivities(alice, log(aliceGoalId, {
    entries: [{ type: "project", description: "Built the form", minutes: "60" }], projectId: aliceProjectId,
  })));
  [{ id: aliceActivityId }] = await listGoalActivities(alice, aliceGoalId);
});
afterEach(async () => { await database.close(); });

describe("one user cannot read another user's projects or activities", () => {
  test("lists and lookups are scoped to the owner", async () => {
    expect(await listProjects(bob)).toEqual([]);
    expect(await listProjectOptions(bob)).toEqual([]);
    expect(await getProject(bob, aliceProjectId)).toBeNull();
    expect(await listProjectGoals(bob, aliceProjectId)).toEqual([]);
    expect(await listGoalActivities(bob, aliceGoalId)).toEqual([]);
  });

  test("the owner sees their own data with totals", async () => {
    expect(await getProject(alice, aliceProjectId)).toMatchObject({ activityCount: 1, goalCount: 1, lastActivityOn: "2026-11-03" });
    expect(await listProjectGoals(alice, aliceProjectId)).toEqual([
      { id: aliceGoalId, title: "React goal", topicName: "React", activityCount: 1, totalMinutes: 60 },
    ]);
    expect(await listGoalActivities(alice, aliceGoalId)).toEqual([{
      id: aliceActivityId, type: "project", description: "Built the form", minutes: 60, occurredOn: "2026-11-03",
      project: { id: aliceProjectId, title: "Form lab" },
    }]);
  });

  test("malformed IDs are treated as not found", async () => {
    expect(await getProject(alice, "not-a-uuid")).toBeNull();
    expect(await listGoalActivities(alice, "1; drop table activities")).toEqual([]);
  });
});

describe("one user cannot change another user's projects or activities", () => {
  test("project updates do not reach another owner's project", async () => {
    expect((await updateProject(bob, aliceProjectId, { ...project, title: "Stolen" })).ok).toBe(false);
    expect(await getProject(alice, aliceProjectId)).toMatchObject({ title: "Form lab" });
  });

  test("activity edits and deletes do not reach another owner's activity", async () => {
    expect(await updateActivity(bob, aliceActivityId, edit)).toEqual({ ok: false, error: "This activity could not be found." });
    expect(await deleteActivity(bob, aliceActivityId)).toEqual({ ok: false, error: "This activity could not be found." });
    expect(await listGoalActivities(alice, aliceGoalId)).toMatchObject([{ description: "Built the form" }]);
  });

  test("activities cannot be logged on another owner's goal", async () => {
    expect(await logActivities(bob, log(aliceGoalId))).toEqual({ ok: false, error: "This goal could not be found." });
    expect(await listGoalActivities(alice, aliceGoalId)).toHaveLength(1);
  });

  test("activities cannot link to another owner's project when logged or edited", async () => {
    const linked = await logActivities(bob, log(bobGoalId, {
      entries: [{ type: "project", description: "Borrowed", minutes: "" }], projectId: aliceProjectId,
    }));
    expect(linked).toMatchObject({ ok: false, fieldErrors: { projectId: ["Choose one of your projects."] } });

    expectOk(await logActivities(bob, log(bobGoalId)));
    const [bobActivity] = await listGoalActivities(bob, bobGoalId);
    const moved = await updateActivity(bob, bobActivity.id, { ...edit, type: "project", projectId: aliceProjectId });
    expect(moved).toMatchObject({ ok: false, fieldErrors: { projectId: ["Choose one of your projects."] } });
    expect(await getProject(alice, aliceProjectId)).toMatchObject({ activityCount: 1 });
  });

  test("the composite foreign keys reject cross-owner rows even without the trigger", async () => {
    await database.client.exec("alter table activities disable trigger activities_guard_changes");
    const codes: (string | undefined)[] = [];
    for (const values of [
      { userId: "bob", goalId: aliceGoalId, type: "reading" as const, description: "x", occurredOn: "2026-11-02" },
      { userId: "bob", goalId: bobGoalId, type: "project" as const, projectId: aliceProjectId, description: "x", occurredOn: "2026-11-02" },
    ]) {
      try { await database.db.insert(activities).values(values); } catch (error) { codes.push(databaseErrorCode(error)); }
    }
    expect(codes).toEqual(["23503", "23503"]);
  });
});

describe("logging activities", () => {
  test("several types are saved as one row each, with a new project linked only to the project row", async () => {
    const result = await logActivities(alice, log(aliceGoalId, {
      entries: [
        { type: "course", description: "Finished module 3", minutes: "45" },
        { type: "project", description: "Started the dashboard", minutes: "" },
      ],
      projectId: "new",
      newProject: { title: "Dashboard", repoUrl: "https://gitlab.com/alice/dashboard", liveUrl: "", description: "" },
    }));
    expect(result).toEqual({ ok: true, data: { goalId: aliceGoalId, count: 2 } });

    const logged = await listGoalActivities(alice, aliceGoalId);
    const dashboard = (await listProjectOptions(alice)).find((option) => option.title === "Dashboard");
    expect(logged.find((item) => item.type === "course")).toMatchObject({ minutes: 45, project: null });
    expect(logged.find((item) => item.description === "Started the dashboard"))
      .toMatchObject({ minutes: null, project: { id: dashboard?.id, title: "Dashboard" } });
  });

  test("a failed log saves nothing, including a new project", async () => {
    expectOk(await changeGoalStatus(alice, aliceGoalId, "planned"));
    const result = await logActivities(alice, log(aliceGoalId, {
      entries: [{ type: "project", description: "Started", minutes: "" }],
      projectId: "new",
      newProject: { title: "Orphan", repoUrl: "https://github.com/alice/orphan", liveUrl: "", description: "" },
    }));
    expect(result).toEqual({ ok: false, error: "Only active goals can receive new activities." });
    expect((await listProjectOptions(alice)).map((option) => option.title)).toEqual(["Form lab"]);
  });

  test("deleting an activity keeps its project", async () => {
    expectOk(await deleteActivity(alice, aliceActivityId));
    expect(await listGoalActivities(alice, aliceGoalId)).toEqual([]);
    expect(await getProject(alice, aliceProjectId)).toMatchObject({ activityCount: 0, lastActivityOn: null });
  });

  test("editing can change the type, time, date, and project link", async () => {
    expectOk(await updateActivity(alice, aliceActivityId, edit));
    expect(await listGoalActivities(alice, aliceGoalId)).toEqual([{
      id: aliceActivityId, type: "reading", description: "Changed", minutes: 5, occurredOn: "2026-11-02", project: null,
    }]);
  });
});
