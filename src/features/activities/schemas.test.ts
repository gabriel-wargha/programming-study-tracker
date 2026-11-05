import { describe, expect, test } from "vitest";
import { editActivitySchema, logActivitiesSchema } from "@/features/activities/schemas";
import { addDays, latestActivityDate } from "@/lib/dates/weeks";
import { fieldErrors } from "@/lib/forms/field-errors";

const goalId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const emptyProject = { title: "", repoUrl: "", liveUrl: "", description: "" };
const input = (values: Record<string, unknown> = {}) => ({
  goalId, occurredOn: "2026-11-03", entries: [{ type: "reading", description: "Read", minutes: "" }],
  projectId: "", newProject: emptyProject, ...values,
});
const errorsOf = (values: Record<string, unknown>) => {
  const parsed = logActivitiesSchema.safeParse(input(values));
  return parsed.success ? {} : fieldErrors(parsed.error);
};

describe("the log form schema", () => {
  test("needs at least one activity type, each chosen once", () => {
    expect(errorsOf({ entries: [] })).toEqual({ types: ["Choose at least one thing you did."] });
    expect(errorsOf({ entries: [
      { type: "video", description: "A", minutes: "" }, { type: "video", description: "B", minutes: "" },
    ] })).toEqual({ types: ["Choose each activity type once."] });
  });

  test("errors are reported next to the activity type they belong to", () => {
    expect(errorsOf({ entries: [
      { type: "course", description: " ", minutes: "30" },
      { type: "video", description: "Talk", minutes: "1.5" },
      { type: "other", description: "Pairing", minutes: "1441" },
    ] })).toEqual({
      "description-course": ["Describe what you did."],
      "minutes-video": ["Enter whole minutes from 1 to 1,440."],
      "minutes-other": ["Enter whole minutes from 1 to 1,440."],
    });
  });

  test("time is optional and stored as whole minutes", () => {
    const parsed = logActivitiesSchema.parse(input({ entries: [
      { type: "course", description: " Module 3 ", minutes: "45" }, { type: "reading", description: "Docs", minutes: "" },
    ] }));
    expect(parsed.entries).toEqual([
      { type: "course", description: "Module 3", minutes: 45 }, { type: "reading", description: "Docs", minutes: null },
    ]);
  });

  test("future dates are rejected", () => {
    expect(errorsOf({ occurredOn: addDays(latestActivityDate(), 1) })).toEqual({ occurredOn: ["The date can't be in the future."] });
    expect(errorsOf({ occurredOn: "2026-02-30" })).toEqual({ occurredOn: ["Enter a valid date."] });
  });

  test("a project activity needs an existing project or a valid new one", () => {
    const project = [{ type: "project", description: "Built it", minutes: "" }];
    expect(errorsOf({ entries: project })).toEqual({ projectId: ["Choose a project or add a new one."] });
    expect(errorsOf({ entries: project, projectId: "new", newProject: { ...emptyProject, repoUrl: "http://github.com/a/b" } })).toEqual({
      projectTitle: ["Enter a project title."], projectRepoUrl: ["Enter a full URL that starts with https://."],
    });
    expect(logActivitiesSchema.parse(input({ entries: project, projectId })).project).toEqual({ kind: "existing", id: projectId });
  });

  test("project choices are ignored when no project activity is selected", () => {
    expect(logActivitiesSchema.parse(input({ projectId: "new", newProject: { ...emptyProject, repoUrl: "nope" } })).project).toBeNull();
  });
});

describe("the edit activity schema", () => {
  const edit = { id: projectId, occurredOn: "2026-11-03", type: "reading", description: "Read", minutes: "10", projectId };

  test("drops the project for non-project activities", () => {
    expect(editActivitySchema.parse(edit)).toMatchObject({ type: "reading", minutes: 10, projectId: null });
  });

  test("requires a project for project activities", () => {
    const parsed = editActivitySchema.safeParse({ ...edit, type: "project", projectId: "" });
    expect(parsed.success ? {} : fieldErrors(parsed.error)).toEqual({ projectId: ["Choose a project."] });
  });
});
