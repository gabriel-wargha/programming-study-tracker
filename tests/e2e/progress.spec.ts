import { expect, test } from "@playwright/test";

test("the owner reviews the week, rates confidence, and sees the calendar", async ({ page }, info) => {
  test.setTimeout(90_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  const topicName = `SQL ${suffix}`;
  const logged = `Logged goal ${suffix}`;
  const idle = `Idle goal ${suffix}`;

  await page.goto("/settings");
  await page.getByLabel("Maximum active goals").fill("10");
  await page.getByRole("button", { name: "Save limit" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Active goal limit saved.");

  await page.goto("/topics");
  await page.getByLabel("Topic name").fill(topicName);
  await page.getByRole("button", { name: "Create topic" }).click();
  await expect(page.getByRole("heading", { level: 1, name: topicName })).toBeVisible();
  const topicUrl = page.url();
  await expect(page.getByRole("heading", { name: "No ratings yet" })).toBeVisible();

  for (const title of [idle, logged]) {
    await page.goto(topicUrl);
    await page.getByRole("link", { name: "Add a goal to this topic" }).click();
    await page.getByLabel("Goal title").fill(title);
    await page.getByLabel("Definition of done").fill("Done when it is done.");
    await page.getByLabel("Starting status").selectOption("active");
    await page.getByRole("button", { name: "Create goal" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  }

  await page.getByRole("link", { name: "Log this week" }).click();
  await page.getByLabel("Read docs or articles").check();
  const reading = page.getByRole("group", { name: "Read docs or articles" });
  await reading.getByLabel("Description", { exact: true }).fill("Read about window functions.");
  await reading.getByLabel("Minutes (optional)").fill("40");
  await page.getByRole("button", { name: "Save log" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved 1 activity.");

  // The weekly review groups by goal and lists the idle goal.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Review" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Weekly review" })).toBeVisible();
  await expect(page.getByRole("region", { name: logged })).toContainText("Read about window functions.");
  await expect(page.getByRole("region", { name: "Active goals with no activity" }).getByRole("link", { name: idle })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Earlier weeks are available, and later weeks stop at the current one.
  await expect(page.getByRole("link", { name: "Later week" })).toHaveCount(0);
  await page.getByRole("link", { name: "Earlier week" }).click();
  await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/);
  await expect(page.getByRole("region", { name: logged })).toHaveCount(0);
  await page.getByRole("link", { name: "Later week" }).click();
  await expect(page.getByRole("region", { name: logged })).toBeVisible();

  // The calendar labels today's study.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("list", { name: "Study days" }).getByText(/: \d+ activit(y|ies), /).first()).toBeAttached();
  await expect(page.getByRole("heading", { name: "Last 12 months" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Completing a goal prompts for a rating; skipping dismisses it.
  await page.getByRole("list", { name: "Active goals" }).getByRole("link", { name: logged, exact: true }).click();
  await page.getByLabel("Move goal to").selectOption("completed");
  await page.getByRole("checkbox", { name: "I've met the definition of done." }).check();
  await page.getByRole("button", { name: "Complete goal" }).click();
  const prompt = page.getByRole("group", { name: `Goal complete. How confident are you in ${topicName} now?` });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("radio", { name: /^3/ }).check();
  await page.getByRole("button", { name: "Save rating" }).click();
  await expect(page.getByRole("form", { name: "Rate your confidence" }).getByRole("status")).toHaveText("Rating saved.");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(prompt).toHaveCount(0);

  // The topic page shows the rating; a second rating adds to the history.
  await page.goto(topicUrl);
  await expect(page.getByText(/Current rating/).locator("..")).toContainText("3 of 5");
  await page.getByRole("radio", { name: /^5/ }).check();
  await page.getByRole("button", { name: "Save rating" }).click();
  await expect(page.getByText(/Current rating/).locator("..")).toContainText("5 of 5");
  await expect(page.getByRole("list", { name: "Rating history" }).getByRole("listitem")).toHaveCount(2);

  // Leave no active goals for other tests.
  await page.goto("/goals?status=active");
  await page.getByRole("link", { name: idle, exact: true }).click();
  await page.getByLabel("Move goal to").selectOption("planned");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByRole("form", { name: "Change goal status" }).getByRole("status")).toHaveText("Goal status updated.");
});

test("on phones, secondary sections open from the More menu", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Settings" })).toBeHidden();
  await nav.getByRole("button", { name: "More" }).click();
  await page.keyboard.press("Escape");
  await expect(nav.getByRole("link", { name: "Settings" })).toBeHidden();
  await nav.getByRole("button", { name: "More" }).click();
  await nav.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(nav.getByRole("link", { name: "Settings" })).toBeHidden();
});
