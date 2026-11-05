// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { activities, goals, projects, topics } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { ensureProfile } from "@/lib/auth/profile";
import { addDays, latestActivityDate } from "@/lib/dates/weeks";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let goalId: string;
let projectId: string;

beforeEach(async () => {
  database = await createTestDatabase();
  await ensureProfile(database.db, "user-a", null);
  const [topic] = await database.db.insert(topics).values({ userId: "user-a", name: "React" }).returning();
  [{ id: goalId }] = await database.db.insert(goals)
    .values({ userId: "user-a", topicId: topic.id, title: "Forms", definitionOfDone: "Ship a form", status: "active" })
    .returning();
  [{ id: projectId }] = await database.db.insert(projects)
    .values({ userId: "user-a", title: "Form lab", repoUrl: "https://github.com/a/form-lab" }).returning();
});
afterEach(async () => { await database.close(); });

const activity = (values: Partial<typeof activities.$inferInsert> = {}) => ({
  userId: "user-a", goalId, type: "reading" as const, description: "Read the forms guide", occurredOn: "2026-11-02", ...values,
});
const insertActivity = (values: Partial<typeof activities.$inferInsert> = {}) =>
  database.db.insert(activities).values(activity(values)).returning();
async function codeOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return databaseErrorCode(error); }
  return "no error";
}

describe("activity constraints", () => {
  test.each([0, -5, 1441])("rejects %i minutes", async (minutes) => {
    expect(await codeOf(insertActivity({ minutes }))).toBe("23514");
  });

  test("accepts 1 to 1,440 minutes and no time at all", async () => {
    await expect(insertActivity({ minutes: 1 })).resolves.toHaveLength(1);
    await expect(insertActivity({ minutes: 1440 })).resolves.toHaveLength(1);
    await expect(insertActivity({ minutes: null })).resolves.toHaveLength(1);
  });

  test.each([" ", "", " padded"])("rejects a blank or untrimmed description: %j", async (description) => {
    expect(await codeOf(insertActivity({ description }))).toBe("23514");
  });

  test("a project activity must link to a project, and other types must not", async () => {
    expect(await codeOf(insertActivity({ type: "project" }))).toBe("23514");
    expect(await codeOf(insertActivity({ type: "reading", projectId }))).toBe("23514");
    await expect(insertActivity({ type: "project", projectId })).resolves.toHaveLength(1);
  });
});

describe("activity rules", () => {
  test("only active goals can receive new activities", async () => {
    await database.db.update(goals).set({ status: "planned" }).where(eq(goals.id, goalId));
    expect(await codeOf(insertActivity())).toBe(ruleErrorCodes.goalNotActive);
  });

  test("activities on a goal that is no longer active can still be edited and deleted", async () => {
    const [created] = await insertActivity();
    await database.db.update(goals).set({ status: "completed" }).where(eq(goals.id, goalId));
    const [edited] = await database.db.update(activities).set({ description: "Reread the guide", minutes: 15 })
      .where(eq(activities.id, created.id)).returning();
    expect(edited).toMatchObject({ description: "Reread the guide", minutes: 15 });
    await expect(database.db.delete(activities).where(eq(activities.id, created.id)).returning()).resolves.toHaveLength(1);
  });

  test("activity dates cannot be in the future on insert or update", async () => {
    const latest = latestActivityDate();
    const tomorrow = addDays(latest, 1);
    await expect(insertActivity({ occurredOn: latest })).resolves.toHaveLength(1);
    expect(await codeOf(insertActivity({ occurredOn: tomorrow }))).toBe(ruleErrorCodes.futureActivityDate);

    const [created] = await insertActivity();
    expect(await codeOf(database.db.update(activities).set({ occurredOn: tomorrow })
      .where(eq(activities.id, created.id)))).toBe(ruleErrorCodes.futureActivityDate);
  });

  test("an activity cannot move to another goal or owner", async () => {
    const [created] = await insertActivity();
    const [other] = await database.db.insert(goals).values({
      userId: "user-a", topicId: (await database.db.select().from(topics))[0].id,
      title: "Other", definitionOfDone: "Done", status: "active",
    }).returning();
    expect(await codeOf(database.db.update(activities).set({ goalId: other.id })
      .where(eq(activities.id, created.id)))).toBe(ruleErrorCodes.ownershipChange);
  });

  test("updated_at changes when an activity or project is edited", async () => {
    const [created] = await insertActivity();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const [edited] = await database.db.update(activities).set({ minutes: 10 }).where(eq(activities.id, created.id)).returning();
    expect(edited.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());

    const [project] = await database.db.select().from(projects);
    const [renamed] = await database.db.update(projects).set({ title: "Renamed" }).where(eq(projects.id, projectId)).returning();
    expect(renamed.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
  });
});

describe("project constraints", () => {
  test.each(["http://github.com/a/b", "git@github.com:a/b.git", "javascript:alert(1)", "https://", "https://a b"])(
    "rejects the repository URL %j", async (repoUrl) => {
      expect(await codeOf(database.db.insert(projects).values({ userId: "user-a", title: "X", repoUrl }))).toBe("23514");
    },
  );

  test("the live URL is optional but must be https", async () => {
    expect(await codeOf(database.db.insert(projects)
      .values({ userId: "user-a", title: "X", repoUrl: "https://gitlab.com/a/b", liveUrl: "http://a.dev" }))).toBe("23514");
    await expect(database.db.insert(projects)
      .values({ userId: "user-a", title: "X", repoUrl: "https://gitlab.com/a/b", liveUrl: "https://a.dev" })
      .returning()).resolves.toHaveLength(1);
  });

  test("project ownership cannot change", async () => {
    await ensureProfile(database.db, "user-b", null);
    expect(await codeOf(database.db.update(projects).set({ userId: "user-b" })
      .where(eq(projects.id, projectId)))).toBe(ruleErrorCodes.ownershipChange);
  });
});
