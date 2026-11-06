import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CompletionRatingPrompt } from "@/features/confidence/components/completion-rating-prompt";
import { ConfidenceHistory } from "@/features/confidence/components/confidence-history";
import { ActivityCalendar } from "@/features/dashboard/components/activity-calendar";

const topicId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("the completion prompt requires a rating to save and can be skipped", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { rating: 4 } });
  const { container } = render(<CompletionRatingPrompt action={action} topicId={topicId} topicName="React" />);
  expect(screen.getByRole("group", { name: "Goal complete. How confident are you in React now?" })).toBeVisible();

  await user.click(screen.getByRole("button", { name: "Save rating" }));
  expect(await screen.findByText("Choose a rating from 1 to 5.")).toBeVisible();
  expect(action).not.toHaveBeenCalled();

  await user.click(screen.getByRole("radio", { name: /^4/ }));
  await user.click(screen.getByRole("button", { name: "Save rating" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(action.mock.calls[0][1].get("rating")).toBe("4");
  expect(await screen.findByRole("status")).toHaveTextContent("Rating saved.");

  await user.click(screen.getByRole("button", { name: "Skip" }));
  expect(container).toBeEmptyDOMElement();
});

test("the history shows the current rating and the change over time", () => {
  render(<ConfidenceHistory timeZone="UTC" ratings={[
    { id: "c", rating: 4, ratedAt: new Date("2026-11-03T12:00:00Z") },
    { id: "b", rating: 2, ratedAt: new Date("2026-10-20T12:00:00Z") },
    { id: "a", rating: 3, ratedAt: new Date("2026-10-01T12:00:00Z") },
  ]} />);
  expect(screen.getByText(/Current rating/).parentElement).toHaveTextContent("Current rating: 4 of 5, comfortable");
  const rows = within(screen.getByRole("list", { name: "Rating history" })).getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent("Nov 3, 2026");
  expect(rows[0]).toHaveTextContent("Up 2");
  expect(rows[1]).toHaveTextContent("Down 1");
  expect(rows[2]).toHaveTextContent("First rating");
});

test("rating dates use the owner's time zone", () => {
  render(<ConfidenceHistory timeZone="America/Sao_Paulo" ratings={[{ id: "a", rating: 3, ratedAt: new Date("2026-11-06T01:30:00Z") }]} />);
  expect(screen.getByText("Nov 5, 2026")).toBeVisible();
});

test("the history has an empty state", () => {
  render(<ConfidenceHistory timeZone="UTC" ratings={[]} />);
  expect(screen.getByRole("heading", { name: "No ratings yet" })).toBeVisible();
});

test("each calendar day has a text label", () => {
  render(<ActivityCalendar today="2026-11-05" days={[{ date: "2026-11-02", count: 3, minutes: 90 }]} />);
  const list = screen.getByRole("list", { name: "Study days" });
  expect(within(list).getByText("Nov 2, 2026: 3 activities, 1 h 30 min")).toBeInTheDocument();
  expect(within(list).getByText("Nov 3, 2026: 0 activities")).toBeInTheDocument();
  expect(screen.getByText("1 study day")).toBeVisible();
});
