// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { goals, reviewReminders } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { changeGoalStatus, createGoal } from "@/features/goals/mutations";
import { finishReminder } from "@/features/reminders/mutations";
import { listDueReminders } from "@/features/reminders/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let goalId: string;
const completedOn = "2026-11-05";

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const allReminders = () => database.db.select().from(reviewReminders).orderBy(reviewReminders.stage);
const complete = async (today = completedOn) => expectOk(await changeGoalStatus(alice, goalId, "completed", today));

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice" };
  bob = { db: database.db, userId: "bob" };
  await ensureProfile(database.db, "alice", null);
  await ensureProfile(database.db, "bob", null);
  const topicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
  goalId = expectOk(await createGoal(alice, {
    topicId, title: "Forms", description: null, definitionOfDone: "Done", targetDate: null, status: "active",
  })).id;
});
afterEach(async () => { await database.close(); });

describe("review reminders", () => {
  test("completing a goal creates a reminder due 7 days later", async () => {
    await complete();
    expect(await allReminders()).toMatchObject([{ goalId, stage: 1, dueOn: "2026-11-12", completedAt: null }]);
  });

  test("only reminders due today or earlier are listed", async () => {
    await complete();
    expect(await listDueReminders(alice, "2026-11-11")).toEqual([]);
    expect(await listDueReminders(alice, "2026-11-12")).toMatchObject([{ goalId, goalTitle: "Forms", topicName: "React", stage: 1 }]);
    expect(await listDueReminders(alice, "2026-12-30")).toHaveLength(1);
  });

  test("finishing the first review creates a second one due 30 days later", async () => {
    await complete();
    const [first] = await listDueReminders(alice, "2026-11-12");
    expectOk(await finishReminder(alice, first.id, "2026-11-14"));
    expect(await listDueReminders(alice, "2026-12-13")).toEqual([]);
    expect(await listDueReminders(alice, "2026-12-14")).toMatchObject([{ stage: 2, dueOn: "2026-12-14" }]);
    const [, second] = await allReminders();
    expectOk(await finishReminder(alice, second.id, "2026-12-14"));
    expect(await allReminders()).toHaveLength(2);
    expect(await listDueReminders(alice, "2030-01-01")).toEqual([]);
  });

  test("a reminder can't be finished twice", async () => {
    await complete();
    const [first] = await allReminders();
    expectOk(await finishReminder(alice, first.id, "2026-11-12"));
    expect((await finishReminder(alice, first.id, "2026-11-13")).ok).toBe(false);
  });

  test("reopening a goal removes unfinished reminders and keeps finished ones", async () => {
    await complete();
    const [first] = await allReminders();
    expectOk(await finishReminder(alice, first.id, "2026-11-12"));
    expect(await allReminders()).toHaveLength(2);
    expectOk(await changeGoalStatus(alice, goalId, "active"));
    expect(await allReminders()).toMatchObject([{ stage: 1, completedAt: expect.any(Date) }]);
  });

  test("completing a reopened goal starts the reviews again", async () => {
    await complete();
    const [first] = await allReminders();
    expectOk(await finishReminder(alice, first.id, "2026-11-12"));
    expectOk(await changeGoalStatus(alice, goalId, "active"));
    await complete("2026-11-20");
    expect(await allReminders()).toMatchObject([{ stage: 1, dueOn: "2026-11-27", completedAt: null }]);
  });

  test("moving between other statuses creates no reminders", async () => {
    expectOk(await changeGoalStatus(alice, goalId, "planned"));
    expectOk(await changeGoalStatus(alice, goalId, "active"));
    expect(await allReminders()).toEqual([]);
  });

  test("a failed status change saves nothing", async () => {
    expectOk(await changeGoalStatus(alice, goalId, "planned"));
    expect((await changeGoalStatus(alice, goalId, "completed", completedOn)).ok).toBe(false);
    expect(await allReminders()).toEqual([]);
  });

  test("archived goals no longer show reviews", async () => {
    await complete();
    expectOk(await changeGoalStatus(alice, goalId, "archived"));
    expect(await listDueReminders(alice, "2026-11-12")).toEqual([]);
  });

  test("one user cannot read, finish, or trigger another user's reminders", async () => {
    await complete();
    const [first] = await allReminders();
    expect(await listDueReminders(bob, "2026-11-12")).toEqual([]);
    expect((await finishReminder(bob, first.id, "2026-11-12")).ok).toBe(false);
    expect((await changeGoalStatus(bob, goalId, "active")).ok).toBe(false);
    expect(await allReminders()).toMatchObject([{ completedAt: null }]);
  });

  test("the database limits stages, one per goal, to the goal's owner", async () => {
    await complete();
    const codeOf = async (promise: Promise<unknown>) => {
      try { await promise; } catch (error) { return databaseErrorCode(error); }
      return "no error";
    };
    const base = { userId: "alice", goalId, dueOn: "2026-11-12" };
    expect(await codeOf(database.db.insert(reviewReminders).values({ ...base, stage: 3 }))).toBe("23514");
    expect(await codeOf(database.db.insert(reviewReminders).values({ ...base, stage: 1 }))).toBe("23505");
    expect(await codeOf(database.db.insert(reviewReminders).values({ ...base, userId: "bob", stage: 2 }))).toBe("23503");
    expect(await codeOf(database.db.update(reviewReminders).set({ userId: "bob" }).where(eq(reviewReminders.goalId, goalId)))).toBe(ruleErrorCodes.ownershipChange);
    expect(await database.db.select({ status: goals.status }).from(goals)).toEqual([{ status: "completed" }]);
  });
});
