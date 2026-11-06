// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { confidenceRatings } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { addConfidenceRating } from "@/features/confidence/mutations";
import { listConfidenceRatings } from "@/features/confidence/queries";
import { confidenceRatingSchema } from "@/features/confidence/schemas";
import { createGoal } from "@/features/goals/mutations";
import { getGoalActivitySummary } from "@/features/goals/queries";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let topicId: string;

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
  topicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
});
afterEach(async () => { await database.close(); });

describe("confidence ratings", () => {
  test("every rating is saved and the newest comes first", async () => {
    expectOk(await addConfidenceRating(alice, { topicId, rating: 2 }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    expectOk(await addConfidenceRating(alice, { topicId, rating: 4 }));
    expect((await listConfidenceRatings(alice, topicId)).map((entry) => entry.rating)).toEqual([4, 2]);
  });

  test.each([0, 6])("the database rejects a rating of %i", async (rating) => {
    let code: string | undefined;
    try { await database.db.insert(confidenceRatings).values({ userId: "alice", topicId, rating }); }
    catch (error) { code = databaseErrorCode(error); }
    expect(code).toBe("23514");
  });

  test("the schema accepts whole ratings from 1 to 5", () => {
    expect(confidenceRatingSchema.parse({ topicId, rating: "3" }).rating).toBe(3);
    for (const rating of ["0", "6", "2.5", "x", null]) {
      expect(confidenceRatingSchema.safeParse({ topicId, rating }).success).toBe(false);
    }
  });

  test("saved ratings cannot be changed", async () => {
    expectOk(await addConfidenceRating(alice, { topicId, rating: 2 }));
    let code: string | undefined;
    try { await database.db.update(confidenceRatings).set({ rating: 5 }).where(eq(confidenceRatings.topicId, topicId)); }
    catch (error) { code = databaseErrorCode(error); }
    expect(code).toBe(ruleErrorCodes.ownershipChange);
  });

  test("one user cannot read or add ratings on another user's topic", async () => {
    expectOk(await addConfidenceRating(alice, { topicId, rating: 3 }));
    expect(await listConfidenceRatings(bob, topicId)).toEqual([]);
    expect(await addConfidenceRating(bob, { topicId, rating: 1 })).toEqual({ ok: false, error: "This topic could not be found." });
    expect(await listConfidenceRatings(alice, topicId)).toHaveLength(1);
  });
});

describe("goal_activity_summary", () => {
  test("the view uses security_invoker", async () => {
    const { rows } = await database.client.query<{ reloptions: string[] }>(
      "select reloptions from pg_class where relname = 'goal_activity_summary'",
    );
    expect(rows[0].reloptions).toContain("security_invoker=true");
  });

  test("a goal's summary is scoped to its owner and handles no activity", async () => {
    const goalId = expectOk(await createGoal(alice, {
      topicId, title: "Forms", description: null, definitionOfDone: "Done", targetDate: null, status: "active",
    })).id;
    expect(await getGoalActivitySummary(alice, goalId)).toMatchObject({ status: "active", lastActivityOn: null, activityCount: 0, totalMinutes: 0 });
    expect(await getGoalActivitySummary(bob, goalId)).toBeNull();
    expect(await getGoalActivitySummary(alice, "not-a-uuid")).toBeNull();
    await database.client.query(
      "insert into activities (user_id, goal_id, type, description, occurred_on, minutes) values ('alice', $1, 'reading', 'Docs', '2026-10-01', 30), ('alice', $1, 'video', 'Talk', '2026-10-03', null)",
      [goalId],
    );
    expect(await getGoalActivitySummary(alice, goalId)).toMatchObject({ lastActivityOn: "2026-10-03", activityCount: 2, totalMinutes: 30 });
  });
});
