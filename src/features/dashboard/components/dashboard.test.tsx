import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import AppError from "@/app/(app)/error";
import { ActiveGoalProgress } from "@/features/dashboard/components/active-goal-progress";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { WeekSummaryPanel } from "@/features/dashboard/components/week-summary";

const goalId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("active goals show this week's progress, the latest activity, and a log link", () => {
  render(<ActiveGoalProgress activeGoalLimit={3} goals={[
    {
      id: goalId, title: "Forms", topicName: "React", weekActivityCount: 2, weekMinutes: 90,
      latestActivity: { type: "course", description: "Module 3", occurredOn: "2026-11-05" },
    },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Hooks", topicName: "React", weekActivityCount: 0, weekMinutes: 0, latestActivity: null },
  ]} />);
  expect(screen.getByText("2 of 3 active goal slots in use")).toBeVisible();
  const [forms, hooks] = within(screen.getByRole("list", { name: "Active goals" })).getAllByRole("listitem");
  expect(forms).toHaveTextContent("This week: 2 activities, 1 h 30 min");
  expect(forms).toHaveTextContent("Latest: Took a course on Nov 5, 2026 — Module 3");
  expect(within(forms).getByRole("link", { name: "Log this week: Forms" })).toHaveAttribute("href", `/goals/${goalId}/log`);
  expect(hooks).toHaveTextContent("This week: nothing logged yet");
  expect(hooks).toHaveTextContent("No activity logged yet.");
});

test("without active goals the dashboard explains what to do next", () => {
  render(<ActiveGoalProgress activeGoalLimit={3} goals={[]} />);
  expect(screen.getByRole("heading", { name: "No active goals yet" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Create a goal" })).toHaveAttribute("href", "/goals/new");
});

test("the week summary shows recorded time and explains untimed activities", () => {
  render(<WeekSummaryPanel summary={{ start: "2026-11-02", end: "2026-11-08", activityCount: 3, totalMinutes: 75, untimedCount: 1 }} />);
  const panel = screen.getByRole("region", { name: "This week" });
  expect(panel).toHaveTextContent("Nov 2 – 8, 2026");
  expect(panel).toHaveTextContent("Time recorded1 h 15 min");
  expect(panel).toHaveTextContent("Activities3");
  expect(panel).toHaveTextContent("1 activity has no time recorded and isn't counted in the total.");
});

test("an empty week and no projects have empty states", () => {
  render(<>
    <WeekSummaryPanel summary={{ start: "2026-11-02", end: "2026-11-08", activityCount: 0, totalMinutes: 0, untimedCount: 0 }} />
    <RecentProjects projects={[]} />
  </>);
  expect(screen.getByText("Nothing logged yet this week.")).toBeVisible();
  expect(screen.getByRole("region", { name: "Recent projects" })).toHaveTextContent("No projects yet.");
});

test("the error screen lets the owner try again", async () => {
  const user = userEvent.setup();
  const retry = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(<AppError error={Object.assign(new Error("boom"), { digest: "abc123" })} retry={retry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  expect(screen.getByText("abc123")).toBeVisible();
  expect(screen.queryByText("boom")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
