import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalStatusForm } from "@/features/goals/components/goal-status-form";
import { ActiveGoalLimitForm } from "@/features/settings/components/active-goal-limit-form";
import { TopicForm } from "@/features/topics/components/topic-form";
import { ArchiveTopicForm } from "@/features/topics/components/archive-topic-form";
import type { GoalField } from "@/features/goals/schemas";
import type { TopicField } from "@/features/topics/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

const topic = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "React" };
const activeGoals = [{ id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa", title: "Build a form" }];
const goalValues = { topicId: topic.id, title: "Handle errors", description: "", definitionOfDone: "Errors have accessible messages", targetDate: "" };

function saveGoal() {
  return vi.fn<FormAction<GoalField, { id: string }>>().mockResolvedValue({ ok: true, data: { id: activeGoals[0].id } });
}

test("a goal without a definition of done shows a visible, associated field error", async () => {
  const user = userEvent.setup();
  const action = saveGoal();
  render(<GoalForm action={action} topics={[topic]} activeGoals={[]} activeGoalLimit={3} initialValues={{ ...goalValues, definitionOfDone: "" }} />);
  await user.click(screen.getByRole("button", { name: "Create goal" }));
  const input = screen.getByLabelText("Definition of done");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(expect.stringContaining("Describe what done looks like."));
  expect(action).not.toHaveBeenCalled();
});

test("a full active limit still permits a planned goal and lists current active goals", async () => {
  const user = userEvent.setup();
  const action = saveGoal();
  render(<GoalForm action={action} topics={[topic]} activeGoals={activeGoals} activeGoalLimit={1} initialValues={goalValues} />);
  expect(screen.getByRole("option", { name: "Active" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Build a form" })).toHaveAttribute("href", `/goals/${activeGoals[0].id}`);
  await user.click(screen.getByRole("button", { name: "Create goal" }));
  expect(action.mock.calls[0][1].get("status")).toBe("planned");
});

test("goal creation is unavailable until a topic exists", () => {
  render(<GoalForm action={saveGoal()} topics={[]} activeGoals={[]} activeGoalLimit={3} />);
  expect(screen.getByRole("status")).toHaveTextContent("Create a topic before adding a goal.");
  expect(screen.getByRole("button", { name: "Create goal" })).toBeDisabled();
});

test("completion requires explicit confirmation before submitting", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { status: "completed" } });
  render(<GoalStatusForm action={action} goalId={activeGoals[0].id} currentStatus="active" activeGoals={activeGoals} activeGoalLimit={3} />);
  await user.selectOptions(screen.getByLabelText("Move goal to"), "completed");
  await user.click(screen.getByRole("button", { name: "Complete goal" }));
  expect(screen.getByText("Confirm that you've met the definition of done.")).toBeVisible();
  expect(action).not.toHaveBeenCalled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Complete goal" }));
  expect(action.mock.calls[0][1].get("confirmed")).toBe("on");
});

test("reopening at the limit displays the active goals without submitting", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(<GoalStatusForm action={action} goalId={topic.id} currentStatus="completed" activeGoals={activeGoals} activeGoalLimit={1} />);
  await user.selectOptions(screen.getByLabelText("Move goal to"), "active");
  await user.click(screen.getByRole("button", { name: "Update status" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Your active goal limit is reached.");
  expect(screen.getByRole("link", { name: "Build a form" })).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});

test("lowering the limit below the active count is blocked with useful links", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(<ActiveGoalLimitForm action={action} activeGoalLimit={3} activeGoals={[...activeGoals, { id: topic.id, title: "Test keyboard controls" }]} />);
  await user.clear(screen.getByLabelText("Maximum active goals"));
  await user.type(screen.getByLabelText("Maximum active goals"), "1");
  await user.click(screen.getByRole("button", { name: "Save limit" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Move active goals to planned");
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(action).not.toHaveBeenCalled();
});

test("a server error preserves topic input and the pending state prevents another submission", async () => {
  const user = userEvent.setup();
  let settle: ((result: FormResult<TopicField, { id: string }>) => void) | undefined;
  const action = vi.fn<FormAction<TopicField, { id: string }>>(() => new Promise((resolve) => { settle = resolve; }));
  render(<TopicForm action={action} />);
  const name = screen.getByLabelText("Topic name");
  await user.tab();
  expect(name).toHaveFocus();
  await user.type(name, "React");
  await user.click(screen.getByRole("button", { name: "Create topic" }));
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(name).toBeDisabled();
  await act(async () => { settle?.({ ok: false, error: "A topic with this name already exists." }); });
  expect(screen.getByRole("alert")).toHaveTextContent("already exists");
  expect(name).toHaveValue("React");
});

test("a topic with active goals cannot be archived through the form", () => {
  const action = vi.fn();
  render(<ArchiveTopicForm action={action} topicId={topic.id} activeGoals={activeGoals} />);
  expect(screen.getByRole("button", { name: "Archive topic" })).toBeDisabled();
  expect(screen.getByRole("link", { name: "Build a form" })).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});
