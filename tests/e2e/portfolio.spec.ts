import { expect, test, type Page } from "@playwright/test";

async function completeGoal(page: Page, topicUrl: string, title: string, secretActivity: string) {
  await page.goto(topicUrl);
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(title);
  await page.getByLabel("Definition of done").fill(`${title} is finished.`);
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const goalUrl = page.url();

  await page.getByRole("link", { name: "Log this week" }).click();
  await page.getByLabel("Other").check();
  await page.getByRole("group", { name: "Other" }).getByLabel("Description", { exact: true }).fill(secretActivity);
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved 1 activity." })).toBeVisible();

  await page.goto(goalUrl);
  await page.getByLabel("Move goal to").selectOption("completed");
  await page.getByRole("checkbox", { name: "I've met the definition of done." }).check();
  await page.getByRole("button", { name: "Complete goal" }).click();
  await expect(page.getByRole("form", { name: "Portfolio visibility" })).toBeVisible();
  return goalUrl;
}

test("a visitor sees only what the owner chose to make public", async ({ page, browser }, info) => {
  test.setTimeout(120_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  const slug = `owner-${suffix}`;
  const publicGoal = `Public goal ${suffix}`;
  const privateGoal = `Private goal ${suffix}`;
  const activeGoal = `Active goal ${suffix}`;
  const publicProject = `Public project ${suffix}`;
  const privateProject = `Private project ${suffix}`;
  const secretActivity = `Secret activity ${suffix}`;
  const secretBlocker = `Secret blocker ${suffix}`;
  const secretResource = `Secret resource ${suffix}`;

  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Active goal limit saved.");

  // The page doesn't exist until the owner turns it on.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`/u/${slug}`);
  await expect(visitor.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();

  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(`Portfolio topic ${suffix}`);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Portfolio topic ${suffix}` })).toBeVisible();
  const topicUrl = page.url();

  await page.getByText("Add a resource", { exact: true }).click();
  await page.getByLabel("Resource title").fill(secretResource);
  await page.getByRole("button", { name: "Add resource" }).click();
  await expect(page.getByRole("list", { name: "Resources" })).toContainText(secretResource);
  await page.getByRole("radio", { name: /^2/ }).check();
  await page.getByRole("button", { name: "Save rating" }).click();
  await expect(page.getByText(/Current rating/).locator("..")).toContainText("2 of 5");

  // One completed goal goes public; the other stays private.
  const publicUrl = await completeGoal(page, topicUrl, publicGoal, secretActivity);
  await page.getByText("This goal is private.").waitFor();
  await page.getByRole("button", { name: "Show on portfolio" }).click();
  await expect(page.getByText("This goal appears on your portfolio.")).toBeVisible();
  await page.getByText("Add a blocker", { exact: true }).click();
  await page.getByLabel("What's blocking you?").fill(secretBlocker);
  await page.getByRole("button", { name: "Add blocker" }).click();
  await expect(page.getByRole("list", { name: "Blockers" })).toContainText(secretBlocker);

  await completeGoal(page, topicUrl, privateGoal, secretActivity);

  // An active goal offers no public option.
  await page.goto(topicUrl);
  await page.getByRole("link", { name: "Add a goal to this topic" }).click();
  await page.getByLabel("Goal title").fill(activeGoal);
  await page.getByLabel("Definition of done").fill("Not finished.");
  await page.getByLabel("Starting status").selectOption("active");
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { level: 1, name: activeGoal })).toBeVisible();
  await expect(page.getByRole("form", { name: "Portfolio visibility" })).toHaveCount(0);
  const activeUrl = page.url();

  for (const [title, shared] of [[publicProject, true], [privateProject, false]] as const) {
    await page.goto("/projects");
    await page.getByLabel("Project title").fill(title);
    await page.getByLabel("Repository URL").fill("https://codeberg.org/owner/portfolio-lab");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("This project is private.")).toBeVisible();
    if (shared) {
      await page.getByRole("button", { name: "Show on portfolio" }).click();
      await expect(page.getByText("This project appears on your portfolio.")).toBeVisible();
    }
  }

  // Marking items public isn't enough while the portfolio is off.
  await visitor.reload();
  await expect(visitor.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();

  // Turn on the portfolio.
  await page.goto("/settings");
  const form = page.getByRole("form", { name: "Portfolio settings" });
  await form.getByRole("checkbox").check();
  await form.getByLabel("Page address").fill("Not Valid");
  await form.getByRole("button", { name: "Save portfolio" }).click();
  await expect(form.getByLabel("Page address")).toHaveAccessibleDescription(/lowercase/);
  await form.getByLabel("Page address").fill(slug);
  await form.getByLabel("Display name (optional)").fill(`Owner ${suffix}`);
  await form.getByLabel("Headline (optional)").fill("Learning in public");
  await form.getByRole("button", { name: "Save portfolio" }).click();
  await expect(form.getByRole("status")).toHaveText("Portfolio settings saved.");
  await expect(form.getByRole("link", { name: "View my portfolio" })).toHaveAttribute("href", `/u/${slug}`);

  // The visitor sees the public items, with no app navigation.
  await visitor.goto(`/u/${slug}`);
  await expect(visitor.getByRole("heading", { level: 1, name: `Owner ${suffix}` })).toBeVisible();
  await expect(visitor.getByRole("region", { name: "Completed goals" })).toContainText(publicGoal);
  await expect(visitor.getByRole("region", { name: "Projects" })).toContainText(publicProject);
  await expect(visitor.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  expect(await visitor.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Private data is absent from the visible page, the HTML, and the data sent to the browser.
  const raw = await (await visitor.request.get(`/u/${slug}`)).text();
  for (const source of [await visitor.content(), raw]) {
    for (const secret of [privateGoal, activeGoal, privateProject, secretActivity, secretBlocker, secretResource, "local-owner"]) {
      expect(source, `the public page must not contain "${secret}"`).not.toContain(secret);
    }
    expect(source).toContain(publicGoal);
  }

  // Reopening a public goal takes it off the portfolio.
  await page.goto(publicUrl);
  await page.getByLabel("Move goal to").selectOption("active");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
  await visitor.reload();
  await expect(visitor.getByRole("heading", { level: 1, name: `Owner ${suffix}` })).toBeVisible();
  await expect(visitor.getByText(publicGoal)).toHaveCount(0);

  // Turning the portfolio off hides the whole page again.
  await page.goto("/settings");
  await page.getByRole("form", { name: "Portfolio settings" }).getByRole("checkbox").uncheck();
  await page.getByRole("button", { name: "Save portfolio" }).click();
  await expect(page.getByRole("form", { name: "Portfolio settings" }).getByRole("status")).toHaveText("Portfolio settings saved.");
  await visitor.reload();
  await expect(visitor.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await visitor.context().close();

  // Leave no active goals for other tests.
  for (const url of [publicUrl, activeUrl]) {
    await page.goto(url);
    await page.getByLabel("Move goal to").selectOption("planned");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
  }
});
