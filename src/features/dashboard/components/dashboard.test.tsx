import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import AppError from "@/app/(app)/error";
import { ActiveGoalProgress } from "@/features/dashboard/components/active-goal-progress";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { WeekSummaryPanel } from "@/features/dashboard/components/week-summary";
import type { WeekDay } from "@/features/dashboard/schemas";

const days = (values: Partial<Record<number, Omit<WeekDay, "date">>> = {}): WeekDay[] =>
  Array.from({ length: 7 }, (_, index) => ({
    date: `2026-11-0${index + 2}`, activityCount: 0, minutes: 0, ...values[index],
  }));

const goalId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("active goals show this week's progress, the latest activity, and a log link", () => {
  render(<ActiveGoalProgress activeGoalLimit={3} goals={[
    {
      id: goalId, title: "Forms", topicName: "React", weekActivityCount: 2, weekMinutes: 90, stalledDays: null,
      latestActivity: { type: "course", description: "Module 3", occurredOn: "2026-11-05" },
    },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Hooks", topicName: "React", weekActivityCount: 0, weekMinutes: 0, latestActivity: null, stalledDays: 20 },
  ]} />);
  expect(screen.getByRole("region", { name: "Active goals" })).toHaveTextContent("2 of 3 active goal slots in use");
  const [forms, hooks] = within(screen.getByRole("list", { name: "Active goals" })).getAllByRole("listitem");
  expect(forms).toHaveTextContent("This week: 2 activities, 1 h 30 min");
  expect(forms).toHaveTextContent(/Latest:\s*Took a course\s*on\s*Nov 5, 2026\s*Module 3/);
  expect(within(forms).getByRole("link", { name: "Log this week: Forms" })).toHaveAttribute("href", `/goals/${goalId}/log`);
  expect(hooks).toHaveTextContent("This week: nothing logged yet");
  expect(hooks).toHaveTextContent("No activity logged yet.");
  expect(hooks).toHaveTextContent("Stalled: no activity for 20 days");
  expect(forms).not.toHaveTextContent("Stalled");
});

test("without active goals the dashboard explains what to do next", () => {
  render(<ActiveGoalProgress activeGoalLimit={3} goals={[]} />);
  expect(screen.getByRole("heading", { name: "No active goals yet" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Create a goal" })).toHaveAttribute("href", "/goals/new");
});

test("the week summary shows recorded time per day and explains untimed activities", () => {
  render(<WeekSummaryPanel today="2026-11-05" summary={{
    start: "2026-11-02", end: "2026-11-08", activityCount: 3, totalMinutes: 75, untimedCount: 1,
    days: days({ 0: { activityCount: 1, minutes: 45 }, 3: { activityCount: 2, minutes: 30 } }),
  }} />);
  const panel = screen.getByRole("region", { name: "This week" });
  expect(panel).toHaveTextContent("Nov 2 – 8, 2026");
  expect(panel).toHaveTextContent("Time recorded1 h 15 min");
  expect(panel).toHaveTextContent("Activities3");
  expect(panel).toHaveTextContent("1 activity has no time recorded and isn't counted in the total.");
  const dayItems = within(screen.getByRole("list", { name: "Days this week" })).getAllByRole("listitem");
  expect(dayItems).toHaveLength(7);
  expect(dayItems[0]).toHaveTextContent("Monday, Nov 2: 1 activity, 45 min");
  expect(dayItems[1]).toHaveTextContent("Tuesday, Nov 3: nothing logged");
  expect(dayItems[3]).toHaveTextContent("Thursday, Nov 5: 2 activities, 30 min (today)");
});

test("an empty week and no projects have empty states", () => {
  render(<>
    <WeekSummaryPanel summary={{ start: "2026-11-02", end: "2026-11-08", activityCount: 0, totalMinutes: 0, untimedCount: 0, days: days() }} />
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
