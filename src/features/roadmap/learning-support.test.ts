// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { activities, blockers, projects, resources } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { logActivities, updateActivity } from "@/features/activities/mutations";
import { listGoalActivities } from "@/features/activities/queries";
import { logActivitiesSchema } from "@/features/activities/schemas";
import { createBlocker, reopenBlocker, solveBlocker } from "@/features/blockers/mutations";
import { listGoalBlockers } from "@/features/blockers/queries";
import { changeGoalStatus, createGoal } from "@/features/goals/mutations";
import { createProject, syncProjectGitHub, updateProject } from "@/features/projects/mutations";
import { getProject } from "@/features/projects/queries";
import { isGitHubStale } from "@/features/projects/schemas";
import { createResource, deleteResource, updateResource } from "@/features/resources/mutations";
import { listResourceOptions, listTopicResources } from "@/features/resources/queries";
import { getWeeklyReview } from "@/features/review/queries";
import { addPrerequisite, removePrerequisite } from "@/features/roadmap/mutations";
import { getRoadmap, listUnfinishedPrerequisites } from "@/features/roadmap/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let topicId: string;
let goalId: string;

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const topic = async (scope: UserScope, name: string) => expectOk(await createTopic(scope, { name, description: null })).id;
const goal = async (scope: UserScope, inTopic: string, title = "Forms") => expectOk(await createGoal(scope, {
  topicId: inTopic, title, description: null, definitionOfDone: "Done", targetDate: null, status: "active",
})).id;
const docs = { title: "Handbook", url: "https://example.dev/handbook", type: "docs" as const, status: "to_do" as const };
async function codeOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return databaseErrorCode(error); }
  return "no error";
}

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice" };
  bob = { db: database.db, userId: "bob" };
  await ensureProfile(database.db, "alice", null);
  await ensureProfile(database.db, "bob", null);
  topicId = await topic(alice, "React");
  goalId = await goal(alice, topicId);
});
afterEach(async () => { await database.close(); });

describe("resources", () => {
  test("one user cannot read, change, or delete another user's resources", async () => {
    const id = expectOk(await createResource(alice, topicId, docs)).id;
    expect(await listTopicResources(bob, topicId)).toEqual([]);
    expect(await listResourceOptions(bob, topicId)).toEqual([]);
    expect((await updateResource(bob, id, { ...docs, title: "Stolen" })).ok).toBe(false);
    expect((await deleteResource(bob, id)).ok).toBe(false);
    expect(await createResource(bob, topicId, docs)).toEqual({ ok: false, error: "This topic could not be found." });
    expect(await listTopicResources(alice, topicId)).toMatchObject([{ id, title: "Handbook" }]);
  });

  test("the database allows only https URLs and a fixed owner and topic", async () => {
    const values = { userId: "alice", topicId, title: "X", type: "docs" as const };
    expect(await codeOf(database.db.insert(resources).values({ ...values, url: "http://example.dev" }))).toBe("23514");
    await expect(database.db.insert(resources).values({ ...values, url: null }).returning()).resolves.toHaveLength(1);
    const other = await topic(alice, "Go");
    expect(await codeOf(database.db.update(resources).set({ topicId: other }).where(eq(resources.topicId, topicId))))
      .toBe(ruleErrorCodes.ownershipChange);
  });

  test("an activity can link to a resource from its goal's topic only", async () => {
    const id = expectOk(await createResource(alice, topicId, docs)).id;
    const entry = (resource: string) => logActivitiesSchema.parse({
      goalId, occurredOn: "2026-10-30", projectId: "",
      entries: [{ type: "reading", description: "Read", minutes: "", resource }],
      newProject: { title: "", repoUrl: "", liveUrl: "", description: "" },
    });
    expectOk(await logActivities(alice, entry(id)));
    expect(await listGoalActivities(alice, goalId)).toMatchObject([{ resource: { id, title: "Handbook", url: docs.url } }]);

    const elsewhere = expectOk(await createResource(alice, await topic(alice, "Go"), { ...docs, title: "Tour" })).id;
    expect(await logActivities(alice, entry(elsewhere))).toEqual({ ok: false, error: "Choose a resource from this goal's topic." });

    const [activity] = await listGoalActivities(alice, goalId);
    const edit = { occurredOn: "2026-10-30", type: "reading" as const, description: "Read", minutes: null, projectId: null };
    expect(await updateActivity(alice, activity.id, { ...edit, resourceId: elsewhere })).toMatchObject({ ok: false });
    expectOk(await updateActivity(alice, activity.id, { ...edit, resourceId: null }));
  });

  test("another owner's resource is rejected even without the trigger", async () => {
    const bobTopic = await topic(bob, "Go");
    const bobResource = expectOk(await createResource(bob, bobTopic, docs)).id;
    await database.client.exec("alter table activities disable trigger activities_guard_resource");
    expect(await codeOf(database.db.insert(activities).values({
      userId: "alice", goalId, type: "reading", description: "x", occurredOn: "2026-10-30", resourceId: bobResource,
    }))).toBe("23503");
  });

  test("deleting a resource keeps the activities that used it", async () => {
    const id = expectOk(await createResource(alice, topicId, docs)).id;
    await database.db.insert(activities).values({ userId: "alice", goalId, type: "reading", description: "Read", occurredOn: "2026-10-30", resourceId: id });
    expectOk(await deleteResource(alice, id));
    expect(await listTopicResources(alice, topicId)).toEqual([]);
    expect(await listGoalActivities(alice, goalId)).toMatchObject([{ description: "Read", resource: null }]);
  });
});

describe("blockers", () => {
  test("a blocker needs a solution before it is solved", async () => {
    const { id } = expectOk(await createBlocker(alice, { goalId, title: "CORS error", details: null }));
    for (const solution of [null, "  "]) {
      expect(await codeOf(database.db.update(blockers).set({ status: "solved", solution }).where(eq(blockers.id, id)))).toBe("23514");
    }
    expect(await codeOf(database.db.insert(blockers).values({ userId: "alice", goalId, title: "X", status: "solved" }))).toBe("23514");
  });

  test("solved_at is set and cleared by the database", async () => {
    const { id } = expectOk(await createBlocker(alice, { goalId, title: "CORS error", details: null }));
    const [forged] = await database.db.update(blockers).set({ solvedAt: new Date(0) }).where(eq(blockers.id, id)).returning();
    expect(forged.solvedAt).toBeNull();

    expectOk(await solveBlocker(alice, id, "Added the header"));
    const [solved] = await listGoalBlockers(alice, goalId);
    expect(solved).toMatchObject({ status: "solved", solution: "Added the header" });
    expect(solved.solvedAt).toBeInstanceOf(Date);

    expectOk(await reopenBlocker(alice, id));
    expect(await listGoalBlockers(alice, goalId)).toMatchObject([{ status: "open", solvedAt: null, solution: "Added the header" }]);
  });

  test("open blockers are listed before solved ones", async () => {
    const first = expectOk(await createBlocker(alice, { goalId, title: "First", details: null })).id;
    expectOk(await createBlocker(alice, { goalId, title: "Second", details: null }));
    expectOk(await solveBlocker(alice, first, "Fixed"));
    expect((await listGoalBlockers(alice, goalId)).map((item) => item.title)).toEqual(["Second", "First"]);
  });

  test("one user cannot read, add to, solve, or reopen another user's blockers", async () => {
    const { id } = expectOk(await createBlocker(alice, { goalId, title: "CORS error", details: null }));
    expect(await listGoalBlockers(bob, goalId)).toEqual([]);
    expect(await createBlocker(bob, { goalId, title: "Mine", details: null })).toEqual({ ok: false, error: "This goal could not be found." });
    expect((await solveBlocker(bob, id, "Nope")).ok).toBe(false);
    expect((await reopenBlocker(bob, id)).ok).toBe(false);
    expect(await listGoalBlockers(alice, goalId)).toMatchObject([{ status: "open", solution: null }]);
  });

  test("the weekly review lists blockers opened and solved that week, for the owner only", async () => {
    const opened = expectOk(await createBlocker(alice, { goalId, title: "Opened now", details: null })).id;
    const [{ now }] = (await database.client.query<{ now: string }>("select (now() at time zone 'UTC')::date::text as now")).rows;
    const week = { start: now, end: now };
    expect((await getWeeklyReview(alice, week)).blockersOpened).toMatchObject([{ id: opened, goalId, goalTitle: "Forms" }]);
    expect((await getWeeklyReview(alice, week)).blockersSolved).toEqual([]);
    expectOk(await solveBlocker(alice, opened, "Done"));
    expect((await getWeeklyReview(alice, week)).blockersSolved).toMatchObject([{ id: opened }]);
    expect((await getWeeklyReview(alice, { start: "2020-01-06", end: "2020-01-12" })).blockersOpened).toEqual([]);
    expect((await getWeeklyReview(bob, week)).blockersOpened).toEqual([]);
  });
});

describe("the topic roadmap", () => {
  test("a topic cannot be its own prerequisite or create a loop", async () => {
    const js = await topic(alice, "JavaScript");
    const ts = await topic(alice, "TypeScript");
    expectOk(await addPrerequisite(alice, { topicId, prerequisiteTopicId: ts }));
    expectOk(await addPrerequisite(alice, { topicId: ts, prerequisiteTopicId: js }));

    expect(await addPrerequisite(alice, { topicId, prerequisiteTopicId: topicId })).toMatchObject({ ok: false, fieldErrors: { prerequisiteTopicId: ["A topic can't be its own prerequisite."] } });
    expect(await addPrerequisite(alice, { topicId: ts, prerequisiteTopicId: topicId })).toMatchObject({ ok: false, fieldErrors: { prerequisiteTopicId: [expect.stringContaining("loop")] } });
    expect(await addPrerequisite(alice, { topicId: js, prerequisiteTopicId: topicId })).toMatchObject({ ok: false, fieldErrors: { prerequisiteTopicId: [expect.stringContaining("loop")] } });
    expect(await addPrerequisite(alice, { topicId, prerequisiteTopicId: ts })).toMatchObject({ ok: false, fieldErrors: { prerequisiteTopicId: ["This topic is already a prerequisite."] } });
  });

  test("the roadmap orders topics and a prerequisite finishes with a completed goal", async () => {
    const js = await topic(alice, "JavaScript");
    const jsGoal = await goal(alice, js, "Closures");
    expectOk(await addPrerequisite(alice, { topicId, prerequisiteTopicId: js }));
    expect(await listUnfinishedPrerequisites(alice, topicId)).toEqual([{ id: js, name: "JavaScript" }]);

    const before = await getRoadmap(alice);
    expect(before.stages.map((stage) => stage.topics.map((item) => item.name))).toEqual([["JavaScript"], ["React"]]);
    expect(before.stages[1].topics[0].unfinishedCount).toBe(1);

    expectOk(await changeGoalStatus(alice, jsGoal, "completed"));
    expect(await listUnfinishedPrerequisites(alice, topicId)).toEqual([]);
    expect((await getRoadmap(alice)).stages[1].topics[0]).toMatchObject({ unfinishedCount: 0, prerequisites: [{ finished: true }] });
  });

  test("a prerequisite warns but does not block a goal", async () => {
    const js = await topic(alice, "JavaScript");
    expectOk(await addPrerequisite(alice, { topicId, prerequisiteTopicId: js }));
    await expect(goal(alice, topicId, "Another")).resolves.toEqual(expect.any(String));
  });

  test("one user cannot read or change another user's roadmap", async () => {
    const js = await topic(alice, "JavaScript");
    expectOk(await addPrerequisite(alice, { topicId, prerequisiteTopicId: js }));
    expect((await getRoadmap(bob)).stages).toEqual([]);
    expect(await listUnfinishedPrerequisites(bob, topicId)).toEqual([]);
    expect((await removePrerequisite(bob, { topicId, prerequisiteTopicId: js })).ok).toBe(false);
    expect(await addPrerequisite(bob, { topicId, prerequisiteTopicId: js })).toMatchObject({ ok: false, fieldErrors: { prerequisiteTopicId: ["Choose one of your topics."] } });
    const bobTopic = await topic(bob, "Go");
    expect(await addPrerequisite(bob, { topicId: bobTopic, prerequisiteTopicId: js })).toMatchObject({ ok: false });
    expect((await getRoadmap(alice)).stages).toHaveLength(2);
    expectOk(await removePrerequisite(alice, { topicId, prerequisiteTopicId: js }));
    expect((await getRoadmap(alice)).stages).toHaveLength(1);
  });
});

describe("GitHub project sync", () => {
  const input = { title: "Lab", repoUrl: "https://github.com/o/r", liveUrl: null, description: null };
  const github = () => vi.fn<typeof fetch>(async (request) => {
    const { pathname } = new URL(String(request));
    if (pathname.endsWith("/languages")) return Response.json({ TypeScript: 10 });
    if (pathname.endsWith("/commits")) return Response.json([{ commit: { committer: { date: "2026-11-01T10:00:00Z" } } }]);
    return Response.json({ full_name: "o/r", description: "A lab", language: "TypeScript" });
  });

  test("details are saved for a public GitHub repository", async () => {
    const { id } = expectOk(await createProject(alice, input));
    expect(await syncProjectGitHub(alice, id, { fetchImpl: github(), token: "" })).toEqual({ ok: true, synced: true });
    const project = await getProject(alice, id);
    expect(project).toMatchObject({ githubFullName: "o/r", githubDescription: "A lab", githubPrimaryLanguage: "TypeScript", githubLanguages: { TypeScript: 10 } });
    expect(project?.githubSyncedAt).toBeInstanceOf(Date);
  });

  test("the project stays saved when GitHub fails", async () => {
    const { id } = expectOk(await createProject(alice, input));
    const missing = vi.fn<typeof fetch>(async () => new Response("{}", { status: 404 }));
    expect(await syncProjectGitHub(alice, id, { fetchImpl: missing, token: "" })).toEqual({ ok: false, reason: "not_found" });
    expect(await getProject(alice, id)).toMatchObject({ title: "Lab", githubSyncedAt: null });
  });

  test("other Git hosts are plain links and never call GitHub", async () => {
    const { id } = expectOk(await createProject(alice, { ...input, repoUrl: "https://gitlab.com/o/r" }));
    const fetchImpl = github();
    expect(await syncProjectGitHub(alice, id, { fetchImpl, token: "" })).toEqual({ ok: true, synced: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("changing the repository clears the old details", async () => {
    const { id } = expectOk(await createProject(alice, input));
    await syncProjectGitHub(alice, id, { fetchImpl: github(), token: "" });
    expectOk(await updateProject(alice, id, { ...input, title: "Renamed" }));
    expect(await getProject(alice, id)).toMatchObject({ title: "Renamed", githubFullName: "o/r" });
    expectOk(await updateProject(alice, id, { ...input, repoUrl: "https://gitlab.com/o/r" }));
    expect(await getProject(alice, id)).toMatchObject({ githubFullName: null, githubLanguages: null, githubSyncedAt: null });
  });

  test("one user cannot sync another user's project", async () => {
    const { id } = expectOk(await createProject(alice, input));
    const fetchImpl = github();
    expect(await syncProjectGitHub(bob, id, { fetchImpl, token: "" })).toEqual({ ok: false, reason: "missing_project" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await database.db.select({ name: projects.githubFullName }).from(projects)).toEqual([{ name: null }]);
  });

  test("saved details are stale after 24 hours", () => {
    const now = new Date("2026-11-05T12:00:00Z");
    expect(isGitHubStale(null, now)).toBe(true);
    expect(isGitHubStale(new Date("2026-11-04T12:00:00Z"), now)).toBe(false);
    expect(isGitHubStale(new Date("2026-11-04T11:59:00Z"), now)).toBe(true);
  });
});
