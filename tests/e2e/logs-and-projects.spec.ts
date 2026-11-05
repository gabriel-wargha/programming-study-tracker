import { expect, test, type Page } from "@playwright/test";

async function createActiveGoal(page: Page, suffix: string) {
  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status")).toHaveText("Active goal limit saved.");

  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(`Next.js ${suffix}`);
  await page.getByRole("button", { name: "Create topic" }).click();
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(`Server actions ${suffix}`);
  await page.getByLabel("Definition of done").fill("A form that saves through a Server Action.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Server actions ${suffix}` })).toBeVisible();
}

test("the owner logs a week of work with time and a new project", async ({ page }, info) => {
  const suffix = `${info.project.name}-${Date.now()}`;
  const projectTitle = `Action lab ${suffix}`;
  await createActiveGoal(page, suffix);
  await expect(page.getByRole("heading", { name: "No activity yet" })).toBeVisible();

  // Log two activities, one of them a new project.
  await page.getByRole("link", { name: "Log this week" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Log this week" })).toBeVisible();
  await expect(page.getByLabel("Date")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByText("Choose at least one thing you did.")).toBeVisible();

  await page.getByLabel("Took a course").check();
  const course = page.getByRole("group", { name: "Took a course" });
  await course.getByLabel("Description", { exact: true }).fill("Finished the forms module.");
  await course.getByLabel("Minutes (optional)").fill("45");

  await page.getByLabel("Built a project").check();
  const build = page.getByRole("group", { name: "Built a project" });
  await build.getByLabel("Description", { exact: true }).fill("Built a form with a Server Action.");
  await build.getByLabel("Minutes (optional)").fill("90");
  // Earlier runs may have created projects, so choose "Add a new project" explicitly.
  await build.getByLabel("Project", { exact: true }).selectOption("new");
  await build.getByLabel("Project title").fill(projectTitle);
  await build.getByLabel("Repository URL").fill("http://github.com/owner/action-lab");
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(build.getByLabel("Repository URL")).toHaveAccessibleDescription(/starts with https:\/\//);
  await build.getByLabel("Repository URL").fill("https://github.com/owner/action-lab");
  await page.getByRole("button", { name: "Save log" }).click();

  // The goal page shows the week with its total.
  await expect(page.getByRole("status")).toHaveText("Saved 2 activities.");
  const week = page.getByRole("region", { name: /^Week of / });
  await expect(week).toHaveCount(1);
  await expect(week).toContainText("2 h 15 min recorded · 2 activities");
  await expect(week.getByRole("paragraph").filter({ hasText: "Finished the forms module." })).toBeVisible();

  // Edit the course activity's time.
  const courseItem = week.getByRole("listitem").filter({ hasText: "Finished the forms module." });
  await courseItem.locator("summary", { hasText: /^Edit: Took a course on / }).click();
  await courseItem.getByLabel("Minutes (optional)").fill("15");
  await courseItem.getByRole("button", { name: "Save activity" }).click();
  await expect(courseItem.getByRole("status")).toHaveText("Activity saved.");
  await expect(week).toContainText("1 h 45 min recorded");

  // The project page links back to the goal.
  await week.getByRole("link", { name: projectTitle }).click();
  await expect(page.getByRole("heading", { level: 1, name: projectTitle })).toBeVisible();
  const repoLink = page.getByRole("link", { name: /github\.com\/owner\/action-lab/ });
  await expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("region", { name: "Linked goals" })).toContainText("1 activity · 1 h 30 min recorded");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("link", { name: projectTitle })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Delete the course activity after confirming.
  await page.goBack();
  await page.getByRole("link", { name: `Server actions ${suffix}` }).click();
  await page.getByRole("button", { name: /^Delete Took a course on / }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "Finished the forms module." })).toHaveCount(0);
  await expect(page.getByRole("region", { name: /^Week of / })).toContainText("1 h 30 min recorded · 1 activity");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // A goal that isn't active cannot be logged.
  await page.getByLabel("Move goal to").selectOption("planned");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Only active goals can receive new activities.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Log this week" })).toHaveCount(0);
  await page.goto(`${page.url().split("?")[0].split("#")[0]}/log`);
  await expect(page.getByRole("heading", { name: "This goal isn't active" })).toBeVisible();
});

test("the owner adds a project from the projects page", async ({ page }, info) => {
  const title = `Portfolio ${info.project.name}-${Date.now()}`;
  await page.goto("/projects");
  await page.getByLabel("Project title").fill(title);
  await page.getByLabel("Repository URL").fill("https://codeberg.org/owner/portfolio");
  await page.getByLabel("Live site URL (optional)").fill("http://portfolio.example");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByLabel("Live site URL (optional)")).toHaveAccessibleDescription(/starts with https:\/\//);
  await page.getByLabel("Live site URL (optional)").fill("https://portfolio.example");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("No goals link to this project yet.")).toBeVisible();
});

test("unknown project and log IDs show a not found page", async ({ page }) => {
  for (const path of ["/projects/not-a-uuid", "/projects/00000000-0000-4000-8000-000000000000", "/goals/00000000-0000-4000-8000-000000000000/log"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }
});
