import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ActivityHistory } from "@/features/activities/components/activity-history";
import { ActivityLogForm } from "@/features/activities/components/activity-log-form";
import { DeleteActivityForm } from "@/features/activities/components/delete-activity-form";
import type { ActivityItem, LogField } from "@/features/activities/schemas";
import { ProjectForm } from "@/features/projects/components/project-form";
import { localToday } from "@/lib/dates/weeks";
import type { FormAction } from "@/lib/forms/action-state";

const goalId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const project = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Form lab" };

function saveLog() {
  return vi.fn<FormAction<LogField, { goalId: string; count: number }>>().mockResolvedValue({ ok: true, data: { goalId, count: 2 } });
}

test("the date defaults to today and at least one activity type is required", async () => {
  const user = userEvent.setup();
  const action = saveLog();
  render(<ActivityLogForm action={action} goalId={goalId} projects={[]} />);
  expect(screen.getByLabelText("Date")).toHaveValue(localToday());
  await user.click(screen.getByRole("button", { name: "Save log" }));
  expect(await screen.findByText("Choose at least one thing you did.")).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});

test("each selected type asks for its own description and optional time", async () => {
  const user = userEvent.setup();
  const action = saveLog();
  render(<ActivityLogForm action={action} goalId={goalId} projects={[]} />);
  await user.click(screen.getByLabelText("Took a course"));
  await user.click(screen.getByLabelText("Watched a video"));
  const course = screen.getByRole("group", { name: "Took a course" });
  const video = screen.getByRole("group", { name: "Watched a video" });

  await user.type(within(course).getByLabelText("Description"), "Finished module 3");
  await user.type(within(course).getByLabelText("Minutes (optional)"), "45");
  await user.click(screen.getByRole("button", { name: "Save log" }));

  const videoDescription = within(video).getByLabelText("Description");
  await waitFor(() => expect(videoDescription).toHaveAttribute("aria-invalid", "true"));
  expect(videoDescription).toHaveAccessibleDescription("Describe what you did.");
  expect(action).not.toHaveBeenCalled();

  await user.type(videoDescription, "Talk on server actions");
  await user.click(screen.getByRole("button", { name: "Save log" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  const formData = action.mock.calls[0][1];
  expect(formData.getAll("types")).toEqual(["course", "video"]);
  expect(formData.get("minutes-course")).toBe("45");
  expect(formData.get("minutes-video")).toBe("");
});

test("a project activity can add a new project, which needs an https repository URL", async () => {
  const user = userEvent.setup();
  const action = saveLog();
  render(<ActivityLogForm action={action} goalId={goalId} projects={[]} />);
  await user.click(screen.getByLabelText("Built a project"));
  const group = screen.getByRole("group", { name: "Built a project" });
  await user.type(within(group).getByLabelText("Description"), "Built the dashboard");
  expect(within(group).getByLabelText("Project")).toHaveValue("new");
  await user.type(within(group).getByLabelText("Project title"), "Dashboard");
  await user.type(within(group).getByLabelText("Repository URL"), "http://github.com/me/dashboard");
  await user.click(screen.getByRole("button", { name: "Save log" }));

  const repo = within(group).getByLabelText("Repository URL");
  await waitFor(() => expect(repo).toHaveAccessibleDescription(expect.stringContaining("Enter a full URL that starts with https://.")));
  expect(action).not.toHaveBeenCalled();

  await user.clear(repo);
  await user.type(repo, "https://github.com/me/dashboard");
  await user.click(screen.getByRole("button", { name: "Save log" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(action.mock.calls[0][1].get("projectRepoUrl")).toBe("https://github.com/me/dashboard");
});

test("a project activity must choose an existing project", async () => {
  const user = userEvent.setup();
  const action = saveLog();
  render(<ActivityLogForm action={action} goalId={goalId} projects={[project]} />);
  await user.click(screen.getByLabelText("Built a project"));
  const group = screen.getByRole("group", { name: "Built a project" });
  await user.type(within(group).getByLabelText("Description"), "Added tests");
  await user.click(screen.getByRole("button", { name: "Save log" }));
  expect(await within(group).findByText("Choose a project or add a new one.")).toBeVisible();

  await user.selectOptions(within(group).getByLabelText("Project"), "Form lab");
  await user.click(screen.getByRole("button", { name: "Save log" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(action.mock.calls[0][1].get("projectId")).toBe(project.id);
});

test("dates after the owner's today are rejected in the browser", async () => {
  const user = userEvent.setup();
  const action = saveLog();
  render(<ActivityLogForm action={action} goalId={goalId} projects={[]} />);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await user.clear(screen.getByLabelText("Date"));
  await user.type(screen.getByLabelText("Date"), localToday(tomorrow));
  await user.click(screen.getByLabelText("Other"));
  await user.type(screen.getByLabelText("Description"), "Pairing");
  await user.click(screen.getByRole("button", { name: "Save log" }));
  await waitFor(() => expect(screen.getByLabelText("Date")).toHaveAccessibleDescription(expect.stringContaining("The date can't be in the future.")));
  expect(action).not.toHaveBeenCalled();
});

test("deleting an activity asks for confirmation", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { id: goalId } });
  render(<DeleteActivityForm action={action} activityId={goalId} activityName="Took a course on Nov 3, 2026" />);
  await user.click(screen.getByRole("button", { name: "Delete Took a course on Nov 3, 2026" }));
  expect(action).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "Delete Took a course on Nov 3, 2026" }));
  await user.click(screen.getByRole("button", { name: "Confirm delete" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
});

test("the history groups activities by week with time totals", () => {
  const activities: ActivityItem[] = [
    { id: "a1", type: "course", description: "Module 3", minutes: 45, occurredOn: "2026-11-04", project: null },
    { id: "a2", type: "project", description: "Dashboard", minutes: null, occurredOn: "2026-11-02", project },
    { id: "a3", type: "reading", description: "Docs", minutes: 90, occurredOn: "2026-10-30", project: null },
  ];
  render(<ActivityHistory activities={activities} projects={[project]} updateAction={vi.fn()} deleteAction={vi.fn()} />);
  const thisWeek = screen.getByRole("region", { name: "Week of Nov 2 – 8, 2026" });
  expect(thisWeek).toHaveTextContent("45 min recorded · 2 activities (1 without time)");
  expect(within(thisWeek).getByRole("link", { name: "Form lab" })).toHaveAttribute("href", `/projects/${project.id}`);
  expect(screen.getByRole("region", { name: "Week of Oct 26 – Nov 1, 2026" })).toHaveTextContent("1 h 30 min recorded · 1 activity");
});

test("the history has an empty state", () => {
  render(<ActivityHistory activities={[]} projects={[]} updateAction={vi.fn()} deleteAction={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "No activity yet" })).toBeVisible();
});

test("a project needs a title and an https repository URL", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(<ProjectForm action={action} />);
  await user.type(screen.getByLabelText("Repository URL"), "git@github.com:me/repo.git");
  await user.click(screen.getByRole("button", { name: "Create project" }));
  await waitFor(() => expect(screen.getByLabelText("Project title")).toHaveAccessibleDescription("Enter a project title."));
  expect(screen.getByLabelText("Repository URL")).toHaveAccessibleDescription(expect.stringContaining("Enter a full URL that starts with https://."));
  expect(action).not.toHaveBeenCalled();
});
