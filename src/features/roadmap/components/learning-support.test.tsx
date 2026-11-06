import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { AddBlockerForm, SolveBlockerForm } from "@/features/blockers/components/blocker-forms";
import { GitHubDetails, languageShares } from "@/features/projects/components/github-details";
import type { ProjectSummary } from "@/features/projects/schemas";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { ResourceLibrary } from "@/features/resources/components/resource-library";
import { PrerequisiteWarning } from "@/features/roadmap/components/prerequisite-warning";
import { RoadmapView } from "@/features/roadmap/components/roadmap-view";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = new Date("2026-11-05T12:00:00Z");
const project: ProjectSummary = {
  id, title: "Lab", description: null, repoUrl: "https://github.com/o/r", liveUrl: null, activityCount: 0, goalCount: 0, lastActivityOn: null,
  githubFullName: "o/r", githubDescription: "A lab", githubPrimaryLanguage: "TypeScript", githubLanguages: { TypeScript: 75, CSS: 25 },
  githubLastCommitAt: new Date("2026-11-01T10:00:00Z"), githubSyncedAt: new Date("2026-11-05T10:00:00Z"), isPublic: false,
};

test("a blocker can't be solved without a solution", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { id } });
  render(<SolveBlockerForm action={action} blockerId={id} blockerTitle="CORS" />);
  await user.click(screen.getByRole("button", { name: "Mark as solved" }));
  expect(await screen.findByText("Describe how you solved it.")).toBeVisible();
  expect(action).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("How did you solve it?"), "Added the header");
  await user.click(screen.getByRole("button", { name: "Mark as solved" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
});

test("adding a blocker needs a title and clears the form after saving", async () => {
  const user = userEvent.setup();
  const action = vi.fn().mockResolvedValue({ ok: true, data: { id } });
  render(<AddBlockerForm action={action} goalId={id} />);
  await user.click(screen.getByRole("button", { name: "Add blocker" }));
  expect(await screen.findByText("Describe the problem.")).toBeVisible();
  await user.type(screen.getByLabelText("What's blocking you?"), "CORS");
  await user.click(screen.getByRole("button", { name: "Add blocker" }));
  await waitFor(() => expect(screen.getByLabelText("What's blocking you?")).toHaveValue(""));
});

test("resource URLs must be https", async () => {
  const user = userEvent.setup();
  const action = vi.fn();
  render(<ResourceForm action={action} topicId={id} />);
  await user.type(screen.getByLabelText("Resource title"), "Handbook");
  await user.type(screen.getByLabelText("URL (optional)"), "http://example.dev");
  await user.click(screen.getByRole("button", { name: "Add resource" }));
  expect(await screen.findByText("Enter a full URL that starts with https://.")).toBeVisible();
  expect(action).not.toHaveBeenCalled();
});

test("a failed validation keeps what was typed", async () => {
  const user = userEvent.setup();
  render(<ResourceForm action={vi.fn()} topicId={id} />);
  await user.type(screen.getByLabelText("Resource title"), "Handbook");
  await user.type(screen.getByLabelText("URL (optional)"), "http://example.dev");
  await user.selectOptions(screen.getByLabelText("Type"), "book");
  await user.click(screen.getByRole("button", { name: "Add resource" }));
  await screen.findByText("Enter a full URL that starts with https://.");
  expect(screen.getByLabelText("Resource title")).toHaveValue("Handbook");
  expect(screen.getByLabelText("URL (optional)")).toHaveValue("http://example.dev");
  expect(screen.getByLabelText("Type")).toHaveValue("book");
});

test("the resource library has an empty state and shows type and status in text", () => {
  const { rerender } = render(<ResourceLibrary resources={[]} updateAction={vi.fn()} deleteAction={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "No resources yet" })).toBeVisible();
  rerender(<ResourceLibrary updateAction={vi.fn()} deleteAction={vi.fn()} resources={[{ id, title: "Handbook", url: "https://example.dev", type: "docs", status: "in_progress" }]} />);
  expect(screen.getByRole("link", { name: /Handbook/ })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("Docs, in progress")).toBeVisible();
});

test("GitHub details show language shares and say when they are stale", () => {
  expect(languageShares({ Go: 1, CSS: 99 })).toEqual([{ name: "CSS", percent: 99 }, { name: "Go", percent: 1 }]);
  expect(languageShares({})).toEqual([]);
  const { rerender } = render(<GitHubDetails project={project} timeZone="UTC" now={now} refresh={<button>Refresh</button>} />);
  const panel = screen.getByRole("region", { name: "GitHub details" });
  expect(panel).toHaveTextContent("o/r");
  expect(panel).toHaveTextContent("Nov 1, 2026");
  expect(within(panel).getByRole("list", { name: "Languages" })).toHaveTextContent("TypeScript75%");
  expect(panel).not.toHaveTextContent("more than a day old");

  rerender(<GitHubDetails project={{ ...project, githubSyncedAt: new Date("2026-11-01T00:00:00Z") }} timeZone="UTC" now={now} refresh={null} />);
  expect(screen.getByText(/more than a day old/)).toBeVisible();
});

test("a GitHub problem is explained and unsynced projects invite a refresh", () => {
  const unsynced = { ...project, githubSyncedAt: null };
  const { rerender } = render(<GitHubDetails project={unsynced} timeZone="UTC" now={now} refresh={null} />);
  expect(screen.getByText(/No details loaded yet/)).toBeVisible();
  rerender(<GitHubDetails project={unsynced} timeZone="UTC" now={now} refresh={null} message="GitHub can't find this repository." />);
  expect(screen.getByRole("alert")).toHaveTextContent("GitHub can't find this repository.");
});

test("the prerequisite warning names unfinished topics and is absent otherwise", () => {
  const { container, rerender } = render(<PrerequisiteWarning prerequisites={[]} />);
  expect(container).toBeEmptyDOMElement();
  rerender(<PrerequisiteWarning prerequisites={[{ id, name: "JavaScript" }]} />);
  expect(screen.getByRole("status")).toHaveTextContent("Unfinished prerequisites: JavaScript");
  expect(screen.getByRole("link", { name: "JavaScript" })).toHaveAttribute("href", `/topics/${id}`);
});

test("the roadmap shows stages, prerequisite state in text, and an empty state", () => {
  const props = { addAction: vi.fn(), removeAction: vi.fn() };
  const { rerender } = render(<RoadmapView stages={[]} options={[]} edges={[]} {...props} />);
  expect(screen.getByRole("heading", { name: "No topics yet" })).toBeVisible();
  const js = { id: "js", name: "JavaScript" };
  const react = { id: "react", name: "React" };
  rerender(<RoadmapView options={[js, react]} edges={[{ topicId: "react", prerequisiteTopicId: "js" }]} {...props} stages={[
    { stage: 0, topics: [{ ...js, finished: false, prerequisites: [], unfinishedCount: 0 }] },
    { stage: 1, topics: [{ ...react, finished: false, prerequisites: [{ ...js, finished: false }], unfinishedCount: 1 }] },
  ]} />);
  expect(screen.getByRole("heading", { name: "Start here" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Then, step 2" })).toBeVisible();
  expect(screen.getByRole("list", { name: "Prerequisites of React" })).toHaveTextContent("JavaScript(not finished)");
  expect(screen.getByText(/1 prerequisite isn't finished yet\./)).toBeVisible();
  expect(screen.getByRole("button", { name: "Remove JavaScript as a prerequisite of React" })).toBeVisible();
  // React already lists JavaScript, and a topic can't list itself, so React has no form.
  expect(screen.queryByRole("form", { name: "Add a prerequisite to React" })).toBeNull();
  expect(screen.getByRole("form", { name: "Add a prerequisite to JavaScript" })).toBeVisible();
});
