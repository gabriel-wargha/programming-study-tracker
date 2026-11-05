// @vitest-environment node
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { goals, profiles, topics } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { ensureProfile } from "@/lib/auth/profile";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let topicId: string;

beforeEach(async () => {
  database = await createTestDatabase();
  await ensureProfile(database.db, "user-a", null);
  [{ id: topicId }] = await database.db.insert(topics).values({ userId: "user-a", name: "React" }).returning();
});
afterEach(async () => { await database.close(); });

const goal = (title: string, status: "planned" | "active" = "planned") =>
  ({ userId: "user-a", topicId, title, definitionOfDone: `Finish ${title}`, status });
const insertGoal = async (title: string, status: "planned" | "active" = "planned") =>
  (await database.db.insert(goals).values(goal(title, status)).returning())[0];
const setStatus = (id: string, status: "planned" | "active" | "completed" | "archived") =>
  database.db.update(goals).set({ status }).where(eq(goals.id, id)).returning();
const setLimit = (limit: number) =>
  database.db.update(profiles).set({ activeGoalLimit: limit }).where(eq(profiles.userId, "user-a"));
async function codeOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return databaseErrorCode(error); }
  return "no error";
}

describe("text constraints", () => {
  test.each([" ", "\t\n", " padded"])("rejects a blank or untrimmed definition of done: %j", async (value) => {
    expect(await codeOf(database.db.insert(goals).values({ ...goal("x"), definitionOfDone: value }))).toBe("23514");
  });

  test("topic names are unique per owner regardless of capitalization", async () => {
    expect(await codeOf(database.db.insert(topics).values({ userId: "user-a", name: "react" }))).toBe("23505");
    await ensureProfile(database.db, "user-b", null);
    await expect(database.db.insert(topics).values({ userId: "user-b", name: "React" })).resolves.toBeDefined();
  });
});

describe("goal status rules", () => {
  test("new goals cannot start completed or archived", async () => {
    expect(await codeOf(database.db.insert(goals).values({ ...goal("x"), status: "completed" })))
      .toBe(ruleErrorCodes.invalidStatusChange);
  });

  test("callers cannot set lifecycle timestamps", async () => {
    const created = await insertGoal("Forged", "planned");
    expect(created.startedAt).toBeNull();
    const [forged] = await database.db.update(goals).set({ startedAt: new Date(0), completedAt: new Date(0) })
      .where(eq(goals.id, created.id)).returning();
    expect(forged.startedAt).toBeNull();
    expect(forged.completedAt).toBeNull();
  });

  test("activation, completion, reopening, and archiving follow section 5", async () => {
    const created = await insertGoal("Forms");
    const [active] = await setStatus(created.id, "active");
    expect(active.startedAt).toBeInstanceOf(Date);

    const [completed] = await setStatus(created.id, "completed");
    expect(completed.completedAt).toBeInstanceOf(Date);

    const [reopened] = await setStatus(created.id, "active");
    expect(reopened.completedAt).toBeNull();
    expect(reopened.startedAt).toEqual(active.startedAt);

    await setStatus(created.id, "archived");
    expect(await codeOf(setStatus(created.id, "planned"))).toBe(ruleErrorCodes.invalidStatusChange);
  });

  test("a planned goal must become active before it is completed", async () => {
    const created = await insertGoal("Skip ahead");
    expect(await codeOf(setStatus(created.id, "completed"))).toBe(ruleErrorCodes.invalidStatusChange);
  });

  test("goal ownership cannot change", async () => {
    await ensureProfile(database.db, "user-b", null);
    const created = await insertGoal("Mine");
    expect(await codeOf(database.db.update(goals).set({ userId: "user-b" }).where(eq(goals.id, created.id))))
      .toBe(ruleErrorCodes.ownershipChange);
  });
});

describe("active goal limit", () => {
  test("direct inserts and updates cannot exceed the limit", async () => {
    await setLimit(1);
    const first = await insertGoal("First", "active");
    const second = await insertGoal("Second");
    expect(await codeOf(database.db.insert(goals).values(goal("Overflow", "active"))))
      .toBe(ruleErrorCodes.activeGoalLimitReached);
    expect(await codeOf(setStatus(second.id, "active"))).toBe(ruleErrorCodes.activeGoalLimitReached);

    // Editing an active goal at the limit does not take another slot.
    await expect(database.db.update(goals).set({ title: "First, edited" }).where(eq(goals.id, first.id)))
      .resolves.toBeDefined();
    await setStatus(first.id, "planned");
    await expect(setStatus(second.id, "active")).resolves.toHaveLength(1);
  });

  test("reopening a completed goal needs a free slot", async () => {
    await setLimit(1);
    const done = await insertGoal("Done", "active");
    await setStatus(done.id, "completed");
    await insertGoal("Now active", "active");
    expect(await codeOf(setStatus(done.id, "active"))).toBe(ruleErrorCodes.activeGoalLimitReached);
  });

  test("the limit cannot be lowered below the number of active goals", async () => {
    await insertGoal("One", "active");
    await insertGoal("Two", "active");
    expect(await codeOf(setLimit(1))).toBe(ruleErrorCodes.limitBelowActiveCount);
    await expect(setLimit(2)).resolves.toBeDefined();
  });

  test("other users' active goals do not count", async () => {
    await ensureProfile(database.db, "user-b", null);
    const [other] = await database.db.insert(topics).values({ userId: "user-b", name: "Go" }).returning();
    await database.db.update(profiles).set({ activeGoalLimit: 1 }).where(eq(profiles.userId, "user-b"));
    await database.db.insert(goals).values({ ...goal("B active", "active"), userId: "user-b", topicId: other.id });
    await setLimit(1);
    await expect(insertGoal("A active", "active")).resolves.toBeDefined();
  });
});

describe("topic archiving", () => {
  test("a topic with active goals cannot be archived", async () => {
    await insertGoal("Busy", "active");
    expect(await codeOf(database.db.update(topics).set({ archivedAt: sql`now()` }).where(eq(topics.id, topicId))))
      .toBe(ruleErrorCodes.topicHasActiveGoals);
  });

  test("archived topics keep inactive goals but accept no new or active goals", async () => {
    const planned = await insertGoal("Later");
    await database.db.update(topics).set({ archivedAt: sql`now()` }).where(eq(topics.id, topicId));

    expect(await codeOf(insertGoal("New"))).toBe(ruleErrorCodes.archivedTopic);
    expect(await codeOf(setStatus(planned.id, "active"))).toBe(ruleErrorCodes.archivedTopic);
    await expect(database.db.update(goals).set({ title: "Later, edited" }).where(eq(goals.id, planned.id)))
      .resolves.toBeDefined();

    const [open] = await database.db.insert(topics).values({ userId: "user-a", name: "Vue" }).returning();
    const movable = await database.db.insert(goals).values({ ...goal("Movable"), topicId: open.id }).returning();
    expect(await codeOf(database.db.update(goals).set({ topicId }).where(eq(goals.id, movable[0].id))))
      .toBe(ruleErrorCodes.archivedTopic);
  });

  test("the first archive timestamp is kept", async () => {
    const [first] = await database.db.update(topics).set({ archivedAt: sql`now()` }).where(eq(topics.id, topicId)).returning();
    const [again] = await database.db.update(topics).set({ archivedAt: new Date(0) }).where(eq(topics.id, topicId)).returning();
    expect(again.archivedAt).toEqual(first.archivedAt);
  });
});
