import { expect, test } from "@playwright/test";

// Section 4 of plan.md: topic → goal → log this week → project → dashboard → complete.
test("the main user flow works from topic to completed goal", async ({ page }, info) => {
  // A long flow; on a cold dev server each route compiles on first visit.
  test.setTimeout(60_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  const topicName = `React ${suffix}`;
  const goalTitle = `Accessible forms ${suffix}`;
  const projectTitle = `Signup form ${suffix}`;

  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status")).toHaveText("Active goal limit saved.");

  // 1. Create a topic.
  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(topicName);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: topicName })).toBeVisible();

  // 2. Create an active goal with a definition of done.
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(goalTitle);
  await page.getByLabel("Definition of done").fill("A signup form with labelled fields and inline errors.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: goalTitle })).toBeVisible();

  // The dashboard lists the goal with nothing logged yet.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  const card = page.getByRole("list", { name: "Active goals" }).getByRole("listitem").filter({ hasText: goalTitle });
  await expect(card).toContainText("This week: nothing logged yet");

  // 3–4. Log this week: select what was done, describe it, add time.
  await card.getByRole("link", { name: `Log this week: ${goalTitle}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Log this week" })).toBeVisible();
  await page.getByLabel("Practiced exercises").check();
  const practice = page.getByRole("group", { name: "Practiced exercises" });
  await practice.getByLabel("Description", { exact: true }).fill("Did the form validation exercises.");
  await practice.getByLabel("Minutes (optional)").fill("30");

  // 5. Add the project and its Git link.
  await page.getByLabel("Built a project").check();
  const build = page.getByRole("group", { name: "Built a project" });
  await build.getByLabel("Description", { exact: true }).fill("Built the signup form.");
  await build.getByLabel("Minutes (optional)").fill("90");
  await build.getByLabel("Project", { exact: true }).selectOption("new");
  await build.getByLabel("Project title").fill(projectTitle);
  await build.getByLabel("Repository URL").fill("https://codeberg.org/owner/signup-form");

  // 6. Save and see it on the goal page and the dashboard.
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved 2 activities.");
  await expect(page.getByRole("region", { name: /^Week of / })).toContainText("2 h recorded · 2 activities");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(card).toContainText("This week: 2 activities, 2 h");
  await expect(card).toContainText(/Latest:\s*(Practiced exercises|Built a project)\s*on/);
  await expect(page.getByRole("region", { name: "Recent projects" }).getByRole("link", { name: projectTitle })).toBeVisible();
  await expect(page.getByRole("region", { name: "This week" })).toContainText(/Activities\d+/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // 7. Mark the goal complete once the definition of done is met.
  await card.getByRole("link", { name: goalTitle, exact: true }).click();
  await page.getByLabel("Move goal to").selectOption("completed");
  await page.getByRole("checkbox", { name: "I've met the definition of done." }).check();
  await page.getByRole("button", { name: "Complete goal" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: goalTitle, exact: true })).toHaveCount(0);
});
