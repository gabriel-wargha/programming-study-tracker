// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { goals } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { changeGoalStatus, createGoal, updateGoal } from "@/features/goals/mutations";
import { getActiveGoalLimit, getGoal, listActiveGoals, listGoals } from "@/features/goals/queries";
import { updateActiveGoalLimit } from "@/features/settings/mutations";
import { archiveTopic, createTopic, updateTopic } from "@/features/topics/mutations";
import { getTopic, listTopicOptions, listTopics } from "@/features/topics/queries";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let aliceTopicId: string;
let aliceGoalId: string;

const goalInput = (topicId: string) => ({
  topicId, title: "Forms", description: null, definitionOfDone: "Ship an accessible form", targetDate: null,
});

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
  aliceTopicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
  aliceGoalId = expectOk(await createGoal(alice, { ...goalInput(aliceTopicId), status: "active" })).id;
});
afterEach(async () => { await database.close(); });

describe("one user cannot read another user's data", () => {
  test("lists and lookups are scoped to the owner", async () => {
    expect(await listTopics(bob)).toEqual([]);
    expect(await listGoals(bob)).toEqual([]);
    expect(await listActiveGoals(bob)).toEqual([]);
    expect(await listTopicOptions(bob)).toEqual([]);
    expect(await getTopic(bob, aliceTopicId)).toBeNull();
    expect(await getGoal(bob, aliceGoalId)).toBeNull();
    expect(await listTopicOptions(bob, aliceTopicId)).toEqual([]);
  });

  test("the owner sees their own data", async () => {
    expect(await listTopics(alice)).toMatchObject([{ id: aliceTopicId, goalCount: 1, archived: false }]);
    expect(await getGoal(alice, aliceGoalId)).toMatchObject({ topicName: "React", status: "active" });
  });

  test("malformed IDs are treated as not found", async () => {
    expect(await getTopic(alice, "not-a-uuid")).toBeNull();
    expect(await getGoal(alice, "1; drop table goals")).toBeNull();
  });
});

describe("one user cannot change another user's data", () => {
  test("topic updates and archiving do not reach another owner's topic", async () => {
    expect((await updateTopic(bob, aliceTopicId, { name: "Stolen", description: null })).ok).toBe(false);
    expect((await archiveTopic(bob, aliceTopicId)).ok).toBe(false);
    expect(await getTopic(alice, aliceTopicId)).toMatchObject({ name: "React", archived: false });
  });

  test("goal updates and status changes do not reach another owner's goal", async () => {
    expect((await updateGoal(bob, aliceGoalId, { ...goalInput(aliceTopicId), title: "Stolen" })).ok).toBe(false);
    expect((await changeGoalStatus(bob, aliceGoalId, "planned")).ok).toBe(false);
    expect(await getGoal(alice, aliceGoalId)).toMatchObject({ title: "Forms", status: "active" });
  });

  test("a goal cannot be created in or moved to another owner's topic", async () => {
    const created = await createGoal(bob, { ...goalInput(aliceTopicId), status: "planned" });
    expect(created).toMatchObject({ ok: false, fieldErrors: { topicId: ["Choose one of your topics."] } });

    const bobTopicId = expectOk(await createTopic(bob, { name: "Go", description: null })).id;
    const moved = await updateGoal(alice, aliceGoalId, goalInput(bobTopicId));
    expect(moved).toMatchObject({ ok: false, fieldErrors: { topicId: ["Choose one of your topics."] } });
  });

  test("the composite foreign key rejects a cross-owner goal even without the trigger", async () => {
    await database.client.exec("alter table goals disable trigger goals_guard_changes");
    let code: string | undefined;
    try {
      await database.db.insert(goals).values({ userId: "bob", ...goalInput(aliceTopicId) });
    } catch (error) {
      code = databaseErrorCode(error);
    }
    expect(code).toBe("23503");
  });

  test("changing the limit affects only the current user", async () => {
    expectOk(await updateActiveGoalLimit(bob, 7));
    expect(await getActiveGoalLimit(alice)).toBe(3);
    expect(await getActiveGoalLimit(bob)).toBe(7);
  });
});

describe("mutations return expected failures as results", () => {
  test("a duplicate topic name is a field error", async () => {
    expect(await createTopic(alice, { name: "react", description: null })).toMatchObject({
      ok: false, fieldErrors: { name: ["You already have a topic with this name."] },
    });
  });

  test("the active limit returns the current active goals", async () => {
    expectOk(await updateActiveGoalLimit(alice, 1));
    expect(await createGoal(alice, { ...goalInput(aliceTopicId), title: "More", status: "active" })).toMatchObject({
      ok: false, activeGoals: [{ id: aliceGoalId, title: "Forms" }],
    });
  });

  test("archiving a busy topic lists its active goals", async () => {
    expect(await archiveTopic(alice, aliceTopicId)).toMatchObject({
      ok: false, activeGoals: [{ id: aliceGoalId, title: "Forms" }],
    });
  });

  test("lowering the limit below the active count lists the active goals", async () => {
    expectOk(await createGoal(alice, { ...goalInput(aliceTopicId), title: "Second", status: "active" }));
    expect(await updateActiveGoalLimit(alice, 1)).toMatchObject({ ok: false });
    expect(await getActiveGoalLimit(alice)).toBe(3);
  });

  test("invalid transitions and archived topics give readable errors", async () => {
    expectOk(await changeGoalStatus(alice, aliceGoalId, "planned"));
    expect(await changeGoalStatus(alice, aliceGoalId, "completed")).toEqual({
      ok: false, error: "That goal status change is not available.",
    });
    expectOk(await archiveTopic(alice, aliceTopicId));
    expect(await changeGoalStatus(alice, aliceGoalId, "active")).toEqual({
      ok: false, error: "A goal in an archived topic cannot become active.",
    });
    expect(await listTopicOptions(alice)).toEqual([]);
    expect(await listTopicOptions(alice, aliceTopicId)).toEqual([{ id: aliceTopicId, name: "React" }]);
  });
});
