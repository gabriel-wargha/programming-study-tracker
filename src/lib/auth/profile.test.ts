// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, expect, test } from "vitest";
import { profiles } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { ensureProfile } from "@/lib/auth/profile";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
beforeEach(async () => { database = await createTestDatabase(); });
afterEach(async () => { await database.close(); });

test("creates a profile with the default active goal limit, once", async () => {
  await ensureProfile(database.db, "user-a", "Ada");
  await ensureProfile(database.db, "user-a", "Changed name");

  const rows = await database.db.select().from(profiles);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ userId: "user-a", displayName: "Ada", activeGoalLimit: 3 });
});

test("rejects an active goal limit outside 1 to 10", async () => {
  await ensureProfile(database.db, "user-a", null);
  for (const limit of [0, 11]) {
    await expect(
      database.db.update(profiles).set({ activeGoalLimit: limit }).where(eq(profiles.userId, "user-a")),
    ).rejects.toThrow();
  }
});

test("rejects an empty user ID", async () => {
  await expect(ensureProfile(database.db, "", null)).rejects.toThrow();
});

test("the shared trigger refreshes updated_at on change", async () => {
  await ensureProfile(database.db, "user-a", null);
  const [before] = await database.db.select().from(profiles);
  await database.client.query("select pg_sleep(0.01)");
  const [after] = await database.db.update(profiles).set({ activeGoalLimit: 5 })
    .where(eq(profiles.userId, "user-a")).returning();
  expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  expect(after.createdAt).toEqual(before.createdAt);
});
