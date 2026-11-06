import { expect, test } from "@playwright/test";

test("the owner manages resources, blockers, and the roadmap", async ({ page }, info) => {
  test.setTimeout(90_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  const basics = `Basics ${suffix}`;
  const advanced = `Advanced ${suffix}`;
  const goalTitle = `Support goal ${suffix}`;

  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Active goal limit saved.");

  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(basics);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: basics })).toBeVisible();
  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(advanced);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: advanced })).toBeVisible();
  const advancedUrl = page.url();

  // Resources: https only, then saved under the topic.
  await expect(page.getByRole("heading", { name: "No resources yet" })).toBeVisible();
  await page.getByText("Add a resource", { exact: true }).click();
  const add = page.getByRole("form", { name: "Add resource" });
  await add.getByLabel("Resource title").fill("Advanced handbook");
  await add.getByLabel("URL (optional)").fill("http://example.dev");
  await add.getByRole("button", { name: "Add resource" }).click();
  await expect(add.getByLabel("URL (optional)")).toHaveAccessibleDescription(/starts with https:\/\//);
  await add.getByLabel("URL (optional)").fill("https://example.dev/handbook");
  await add.getByRole("button", { name: "Add resource" }).click();
  await expect(page.getByRole("list", { name: "Resources" }).getByRole("link", { name: /Advanced handbook/ })).toBeVisible();

  // The roadmap: order, warning, and loop prevention.
  await page.goto("/roadmap");
  await page.getByRole("form", { name: `Add a prerequisite to ${advanced}` }).getByLabel("Learn first").selectOption({ label: basics });
  await page.getByRole("form", { name: `Add a prerequisite to ${advanced}` }).getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("list", { name: `Prerequisites of ${advanced}` })).toContainText(basics);
  const loop = page.getByRole("form", { name: `Add a prerequisite to ${basics}` });
  await loop.getByLabel("Learn first").selectOption({ label: advanced });
  await loop.getByRole("button", { name: "Add" }).click();
  await expect(loop.getByLabel("Learn first")).toHaveAccessibleDescription(/loop/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // A goal in the topic gets a warning, not a block.
  await page.goto(advancedUrl);
  await expect(page.getByRole("status").filter({ hasText: "Unfinished prerequisites" })).toContainText(basics);
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(goalTitle);
  await page.getByLabel("Definition of done").fill("Done when it is done.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: goalTitle })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Unfinished prerequisites" })).toBeVisible();

  // An activity links to the topic's resource.
  await page.getByRole("link", { name: "Log this week" }).click();
  await page.getByLabel("Read docs or articles").check();
  const reading = page.getByRole("group", { name: "Read docs or articles" });
  await reading.getByLabel("Description", { exact: true }).fill("Read chapter one.");
  await reading.getByLabel("Resource (optional)").selectOption({ label: "Advanced handbook" });
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved 1 activity." })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Week of / }).getByRole("link", { name: /Advanced handbook/ })).toBeVisible();

  // Blockers: a solution is required, and the review lists them.
  await expect(page.getByRole("heading", { name: "No blockers" })).toBeVisible();
  await page.getByText("Add a blocker", { exact: true }).click();
  await page.getByLabel("What's blocking you?").fill(`CORS error ${suffix}`);
  await page.getByRole("button", { name: "Add blocker" }).click();
  const list = page.getByRole("list", { name: "Blockers" });
  await expect(list).toContainText(`CORS error ${suffix}`);
  await list.locator("summary", { hasText: /^Solve/ }).click();
  await list.getByRole("button", { name: "Mark as solved" }).click();
  await expect(list.getByText("Describe how you solved it.")).toBeVisible();
  await list.getByLabel("How did you solve it?").fill("Added the header.");
  await list.getByRole("button", { name: "Mark as solved" }).click();
  await expect(list.getByText("Added the header.")).toBeVisible();

  await page.goto("/review");
  await expect(page.getByRole("region", { name: "Blockers opened" })).toContainText(`CORS error ${suffix}`);
  await expect(page.getByRole("region", { name: "Blockers solved" })).toContainText(`CORS error ${suffix}`);

  // Leave no active goals for other tests.
  await page.goto("/goals?status=active");
  await page.getByRole("link", { name: goalTitle, exact: true }).click();
  await page.getByLabel("Move goal to").selectOption("planned");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
});

test("a GitHub project is saved even when its details can't be read", async ({ page }, info) => {
  const title = `Missing repo ${info.project.name}-${Date.now()}`;
  await page.goto("/projects");
  await page.getByLabel("Project title").fill(title);
  // This repository doesn't exist, so GitHub reports it missing (or is rate limited or unreachable).
  await page.getByLabel("Repository URL").fill(`https://github.com/study-tracker-e2e/missing-${Date.now()}`);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible({ timeout: 30_000 });
  const panel = page.getByRole("region", { name: "GitHub details" });
  await expect(panel.getByRole("alert")).toContainText(/missing or private|request limit|couldn't be reached|refused/);
  await expect(panel.getByRole("button", { name: "Refresh" })).toBeVisible();
});
