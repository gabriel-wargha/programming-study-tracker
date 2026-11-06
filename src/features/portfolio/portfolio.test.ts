// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { activities, goals, profiles } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { createBlocker } from "@/features/blockers/mutations";
import { addConfidenceRating } from "@/features/confidence/mutations";
import { changeGoalStatus, createGoal, setGoalPublic } from "@/features/goals/mutations";
import { getPortfolioSettings, updatePortfolioSettings } from "@/features/portfolio/mutations";
import { getPublicPortfolio } from "@/features/portfolio/queries";
import { portfolioSettingsSchema } from "@/features/portfolio/schemas";
import { createProject, setProjectPublic } from "@/features/projects/mutations";
import { createResource } from "@/features/resources/mutations";
import { createTopic } from "@/features/topics/mutations";
import { ensureProfile } from "@/lib/auth/profile";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";
import { fieldErrors } from "@/lib/forms/field-errors";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let alice: UserScope;
let bob: UserScope;
let topicId: string;

function expectOk<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
const settings = (values: Partial<Parameters<typeof updatePortfolioSettings>[1]> = {}) =>
  ({ enabled: true, slug: "alice-dev", displayName: "Alice", headline: "Learning in public", githubUsername: "alice", ...values });
const goal = async (title: string, status: "planned" | "active" = "active") => expectOk(await createGoal(alice, {
  topicId, title, description: `${title} description`, definitionOfDone: `${title} done`, targetDate: null, status,
})).id;
const project = async (title: string) => expectOk(await createProject(alice, {
  title, repoUrl: `https://codeberg.org/alice/${title.toLowerCase().replaceAll(" ", "-")}`, liveUrl: null, description: null,
})).id;
const portfolio = (slug = "alice-dev") => getPublicPortfolio(slug, database.db);
async function codeOf(promise: Promise<unknown>) {
  try { await promise; } catch (error) { return databaseErrorCode(error); }
  return "no error";
}

beforeEach(async () => {
  database = await createTestDatabase();
  alice = { db: database.db, userId: "alice-secret-id" };
  bob = { db: database.db, userId: "bob-secret-id" };
  await ensureProfile(database.db, alice.userId, "Alice");
  await ensureProfile(database.db, bob.userId, "Bob");
  topicId = expectOk(await createTopic(alice, { name: "React", description: null })).id;
});
afterEach(async () => { await database.close(); });

describe("getPublicPortfolio", () => {
  test("the portfolio is off by default and returns nothing until enabled", async () => {
    expect(await getPortfolioSettings(alice)).toMatchObject({ enabled: false, slug: "" });
    expectOk(await updatePortfolioSettings(alice, settings({ enabled: false })));
    expect(await portfolio()).toBeNull();
    expectOk(await updatePortfolioSettings(alice, settings()));
    expect(await portfolio()).toMatchObject({ displayName: "Alice", headline: "Learning in public", githubUsername: "alice" });
  });

  test("unknown and malformed slugs return nothing", async () => {
    expectOk(await updatePortfolioSettings(alice, settings()));
    for (const slug of ["nobody-here", "", "x", "' or 1=1 --", "ALICE-DEV"]) expect(await portfolio(slug)).toBeNull();
  });

  test("only public completed goals and public projects appear", async () => {
    expectOk(await updatePortfolioSettings(alice, settings()));
    const shown = await goal("Shown");
    await goal("Active");
    await goal("Planned", "planned");
    const hidden = await goal("Private");
    for (const id of [shown, hidden]) expectOk(await changeGoalStatus(alice, id, "completed"));
    expectOk(await setGoalPublic(alice, shown, true));
    expectOk(await setProjectPublic(alice, await project("Public project"), true));
    await project("Private project");

    const result = await portfolio();
    expect(result?.goals.map((item) => item.title)).toEqual(["Shown"]);
    expect(result?.goals[0]).toMatchObject({ topicName: "React", definitionOfDone: "Shown done" });
    expect(result?.projects.map((item) => item.title)).toEqual(["Public project"]);
  });

  test("the result holds only the listed columns and no private data", async () => {
    expectOk(await updatePortfolioSettings(alice, settings()));
    const id = await goal("Shown");
    const projectId = await project("Public project");
    await database.db.insert(activities).values({ userId: alice.userId, goalId: id, type: "reading", description: "SECRET activity", occurredOn: "2026-11-01", minutes: 777 });
    expectOk(await createBlocker(alice, { goalId: id, title: "SECRET blocker", details: null }));
    expectOk(await addConfidenceRating(alice, { topicId, rating: 2 }));
    expectOk(await createResource(alice, topicId, { title: "SECRET resource", url: null, type: "docs", status: "to_do" }));
    expectOk(await changeGoalStatus(alice, id, "completed"));
    expectOk(await setGoalPublic(alice, id, true));
    expectOk(await setProjectPublic(alice, projectId, true));

    const result = await portfolio();
    expect(Object.keys(result ?? {}).sort()).toEqual(["displayName", "githubUsername", "goals", "headline", "projects"]);
    expect(Object.keys(result?.goals[0] ?? {}).sort()).toEqual(["completedAt", "definitionOfDone", "description", "title", "topicName"]);
    expect(Object.keys(result?.projects[0] ?? {}).sort()).toEqual(["description", "languages", "lastCommitAt", "liveUrl", "primaryLanguage", "repoUrl", "title"]);
    const text = JSON.stringify(result);
    for (const secret of ["SECRET", "777", alice.userId, id, projectId, topicId]) expect(text).not.toContain(secret);
  });

  test("portfolios never mix owners", async () => {
    expectOk(await updatePortfolioSettings(alice, settings()));
    expectOk(await updatePortfolioSettings(bob, settings({ slug: "bob-dev", displayName: "Bob" })));
    expectOk(await setProjectPublic(alice, await project("Alice project"), true));
    expect((await portfolio("bob-dev"))?.projects).toEqual([]);
    expect((await portfolio("alice-dev"))?.projects).toHaveLength(1);
  });
});

describe("public goals", () => {
  test("only completed goals can be public", async () => {
    const id = await goal("Active");
    expect(await setGoalPublic(alice, id, true)).toEqual({ ok: false, error: "Only completed goals can be public." });
    expect(await codeOf(database.db.insert(goals).values({
      userId: alice.userId, topicId, title: "X", definitionOfDone: "Y", isPublic: true,
    }))).toBe(ruleErrorCodes.publicGoalNotCompleted);
  });

  test.each(["active", "archived"] as const)("a public goal that moves to %s becomes private", async (status) => {
    const id = await goal("Shown");
    expectOk(await changeGoalStatus(alice, id, "completed"));
    expectOk(await setGoalPublic(alice, id, true));
    expectOk(await changeGoalStatus(alice, id, status));
    expect(await database.db.select({ isPublic: goals.isPublic }).from(goals).where(eq(goals.id, id))).toEqual([{ isPublic: false }]);
    if (status === "active") {
      expectOk(await changeGoalStatus(alice, id, "completed"));
      expect(await database.db.select({ isPublic: goals.isPublic }).from(goals).where(eq(goals.id, id))).toEqual([{ isPublic: false }]);
    }
  });

  test("one user cannot publish another user's goal or project", async () => {
    const id = await goal("Shown");
    expectOk(await changeGoalStatus(alice, id, "completed"));
    const projectId = await project("Lab");
    expect((await setGoalPublic(bob, id, true)).ok).toBe(false);
    expect((await setProjectPublic(bob, projectId, true)).ok).toBe(false);
    expectOk(await updatePortfolioSettings(alice, settings()));
    expect(await portfolio()).toMatchObject({ goals: [], projects: [] });
  });
});

describe("portfolio settings", () => {
  test("a slug belongs to one owner", async () => {
    expectOk(await updatePortfolioSettings(alice, settings()));
    expect(await updatePortfolioSettings(bob, settings())).toMatchObject({ ok: false, fieldErrors: { slug: ["That address is taken. Try another one."] } });
    expect(await getPortfolioSettings(bob)).toMatchObject({ enabled: false, slug: "" });
  });

  test("the database rejects bad slugs and an enabled portfolio without one", async () => {
    const set = (values: Partial<typeof profiles.$inferInsert>) => database.db.update(profiles).set(values).where(eq(profiles.userId, alice.userId));
    for (const slug of ["Has-Caps", "a b", "-edge", "ab", "double--hyphen"]) expect(await codeOf(set({ portfolioSlug: slug }))).toBe("23514");
    expect(await codeOf(set({ portfolioEnabled: true }))).toBe("23514");
    expect(await codeOf(set({ githubUsername: "bad/name" }))).toBe("23514");
  });

  test("the schema explains slug and username problems", () => {
    const errorsOf = (values: Record<string, unknown>) => {
      const parsed = portfolioSettingsSchema.safeParse({ enabled: false, slug: "", displayName: "", headline: "", githubUsername: "", ...values });
      return parsed.success ? {} : fieldErrors(parsed.error);
    };
    expect(errorsOf({})).toEqual({});
    expect(errorsOf({ enabled: true })).toEqual({ slug: ["Choose a page address to turn on your portfolio."] });
    expect(errorsOf({ slug: "Not Valid" }).slug).toBeDefined();
    expect(errorsOf({ githubUsername: "../evil" }).githubUsername).toEqual(["Enter a valid GitHub username."]);
  });
});
