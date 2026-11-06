import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PortfolioForm } from "@/features/portfolio/components/portfolio-form";
import { PublicPortfolioView } from "@/features/portfolio/components/public-portfolio-view";
import { PublicToggleForm } from "@/features/portfolio/components/public-toggle-form";
import { DueReviews, NoReviewsDue } from "@/features/reminders/components/due-reviews";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const values = { enabled: false, slug: "", displayName: "", headline: "", githubUsername: "" };

test("turning on the portfolio needs a page address, and failed validation keeps the choices", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { slug: "alice-dev" } });
  render(<PortfolioForm action={action} initialValues={values} />);
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.queryByRole("link", { name: "View my portfolio" })).toBeNull();

  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Save portfolio" }));
  await waitFor(() => expect(screen.getByLabelText("Page address")).toHaveAccessibleDescription(expect.stringContaining("Choose a page address")));
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(action).not.toHaveBeenCalled();

  await user.type(screen.getByLabelText("Page address"), "alice-dev");
  await user.click(screen.getByRole("button", { name: "Save portfolio" }));
  expect(await screen.findByRole("link", { name: "View my portfolio" })).toHaveAttribute("href", "/u/alice-dev");
  expect(action.mock.calls[0][1].get("enabled")).toBe("on");
});

test("the visibility control says what will happen in text", async () => {
  const { rerender } = render(<PublicToggleForm action={vi.fn()} id={id} isPublic={false} noun="goal" />);
  expect(screen.getByText("This goal is private.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Show on portfolio" })).toBeVisible();
  rerender(<PublicToggleForm action={vi.fn()} id={id} isPublic noun="project" />);
  expect(screen.getByText("This project appears on your portfolio.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Make private" })).toBeVisible();
});

test("the public page shows shared work and has an empty state", () => {
  const person = { displayName: "Alice", headline: "Learning in public", githubUsername: "alice" };
  const { rerender } = render(<PublicPortfolioView portfolio={{ ...person, goals: [], projects: [] }} />);
  expect(screen.getByRole("heading", { level: 1, name: "Alice" })).toBeVisible();
  expect(screen.getByText("Nothing has been shared here yet.")).toBeVisible();
  expect(screen.getByRole("link", { name: /github\.com\/alice/ })).toHaveAttribute("href", "https://github.com/alice");

  rerender(<PublicPortfolioView portfolio={{
    ...person,
    goals: [{ title: "Forms", description: null, definitionOfDone: "Ship a form", topicName: "React", completedAt: new Date("2026-11-05T00:00:00Z") }],
    projects: [{ title: "Lab", description: null, repoUrl: "https://codeberg.org/a/lab", liveUrl: null, primaryLanguage: "Go", languages: { Go: 3, CSS: 1 }, lastCommitAt: new Date("2026-10-05T00:00:00Z") }],
  }} />);
  expect(screen.getByRole("region", { name: "Completed goals" })).toHaveTextContent("Forms");
  expect(screen.getByRole("region", { name: "Completed goals" })).toHaveTextContent("Nov 2026");
  expect(screen.getByRole("region", { name: "Projects" })).toHaveTextContent("Go 75%, CSS 25%. Latest commit Oct 2026");
  expect(screen.getByRole("link", { name: /codeberg\.org\/a\/lab/ })).toHaveAttribute("rel", "noopener noreferrer");
});

test("due reviews name the goal and the stage, and finishing submits the reminder", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { id } });
  render(<DueReviews action={action} reminders={[{ id, stage: 2, dueOn: "2026-11-12", goalId: id, goalTitle: "Forms", topicName: "React" }]} />);
  const list = screen.getByRole("list", { name: "Reviews due" });
  expect(list).toHaveTextContent("React. Second review, due Nov 12, 2026");
  await user.click(screen.getByRole("button", { name: "Finish review" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(action.mock.calls[0][1].get("id")).toBe(id);
});

test("with no reviews due, the dashboard says so", () => {
  render(<NoReviewsDue />);
  expect(screen.getByRole("region", { name: "Reviews due" })).toHaveTextContent("Nothing to review.");
});
