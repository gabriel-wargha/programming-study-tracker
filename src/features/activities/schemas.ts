import { z } from "zod";
import { projectSchema, type ProjectInput } from "@/features/projects/schemas";
import { latestActivityDate } from "@/lib/dates/weeks";

export const activityTypes = ["course", "reading", "video", "practice", "project", "other"] as const;
export const activityTypeSchema = z.enum(activityTypes, "Choose what you did.");
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const activityTypeLabels: Record<ActivityType, string> = {
  course: "Took a course",
  reading: "Read docs or articles",
  video: "Watched a video",
  practice: "Practiced exercises",
  project: "Built a project",
  other: "Other",
};

export const activityDateSchema = z.iso.date("Enter a valid date.")
  .refine((value) => value <= latestActivityDate(), "The date can't be in the future.");
export const activityDescriptionSchema = z.string().trim().min(1, "Describe what you did.")
  .max(2000, "Use 2,000 characters or fewer.");
/** Optional whole minutes from 1 to 1,440. An empty value becomes null. */
export const activityMinutesSchema = z.string().trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .pipe(z.number("Enter whole minutes from 1 to 1,440.").int("Enter whole minutes from 1 to 1,440.")
    .min(1, "Enter whole minutes from 1 to 1,440.").max(1440, "Enter whole minutes from 1 to 1,440.").nullable());

/** "new" adds a project from the log form; otherwise this is an existing project's ID. */
export const NEW_PROJECT = "new";
const projectFieldNames = { title: "projectTitle", repoUrl: "projectRepoUrl", liveUrl: "projectLiveUrl", description: "projectDescription" } as const;

export type LogField =
  | "goalId" | "occurredOn" | "types" | "projectId"
  | (typeof projectFieldNames)[keyof typeof projectFieldNames]
  | `description-${ActivityType}` | `minutes-${ActivityType}` | `resource-${ActivityType}`;

export type ActivityEntry = { type: ActivityType; description: string; minutes: number | null; resourceId: string | null };
export type ProjectLink = { kind: "existing"; id: string } | { kind: "new"; project: ProjectInput };

const text = z.string().catch("");

/**
 * Validates the log form. Errors use flat field names, such as
 * `description-course`, so each one appears next to its input.
 */
export const logActivitiesSchema = z.object({
  goalId: z.uuid("Choose a valid goal."),
  occurredOn: activityDateSchema,
  entries: z.array(z.object({ type: activityTypeSchema, description: text, minutes: text, resource: text.optional() })).max(activityTypes.length),
  projectId: text,
  newProject: z.object({ title: text, repoUrl: text, liveUrl: text, description: text }),
}).strict().transform((input, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  const types = input.entries.map((entry) => entry.type);
  if (!types.length) issue("types", "Choose at least one thing you did.");
  if (new Set(types).size !== types.length) issue("types", "Choose each activity type once.");

  const entries: ActivityEntry[] = [];
  for (const entry of input.entries) {
    const description = activityDescriptionSchema.safeParse(entry.description);
    const minutes = activityMinutesSchema.safeParse(entry.minutes);
    if (!description.success) issue(`description-${entry.type}`, description.error.issues[0].message);
    if (!minutes.success) issue(`minutes-${entry.type}`, minutes.error.issues[0].message);
    const resourceId = entry.resource || null;
    if (resourceId && !z.uuid().safeParse(resourceId).success) issue(`resource-${entry.type}`, "Choose one of this topic's resources.");
    if (description.success && minutes.success) {
      entries.push({ type: entry.type, description: description.data, minutes: minutes.data, resourceId });
    }
  }

  // Only a project activity links to a project; other choices are ignored.
  let project: ProjectLink | null = null;
  if (types.includes("project")) {
    if (input.projectId === NEW_PROJECT) {
      const parsed = projectSchema.safeParse(input.newProject);
      if (parsed.success) project = { kind: "new", project: parsed.data };
      else for (const problem of parsed.error.issues) {
        issue(projectFieldNames[problem.path[0] as keyof typeof projectFieldNames], problem.message);
      }
    } else if (z.uuid().safeParse(input.projectId).success) {
      project = { kind: "existing", id: input.projectId };
    } else {
      issue("projectId", "Choose a project or add a new one.");
    }
  }
  if (ctx.issues.length) return z.NEVER;
  return { goalId: input.goalId, occurredOn: input.occurredOn, entries, project };
});

export type LogActivitiesInput = z.output<typeof logActivitiesSchema>;

/** Builds the log schema's input from the form, in the browser and on the server. */
export function readLogForm(formData: FormData) {
  const value = (name: string) => formData.get(name) ?? "";
  return {
    goalId: formData.get("goalId"),
    occurredOn: formData.get("occurredOn"),
    entries: formData.getAll("types").map((type) => ({
      type, description: value(`description-${type}`), minutes: value(`minutes-${type}`), resource: value(`resource-${type}`),
    })),
    projectId: value("projectId"),
    newProject: {
      title: value("projectTitle"), repoUrl: value("projectRepoUrl"),
      liveUrl: value("projectLiveUrl"), description: value("projectDescription"),
    },
  };
}

export const editActivitySchema = z.object({
  id: z.uuid("Choose a valid activity."),
  occurredOn: activityDateSchema,
  type: activityTypeSchema,
  description: activityDescriptionSchema,
  minutes: activityMinutesSchema,
  projectId: z.string(),
  resourceId: z.union([z.literal(""), z.uuid("Choose one of this topic's resources.")]).default(""),
}).strict().transform((input, ctx) => {
  const resourceId = input.resourceId || null;
  if (input.type !== "project") return { ...input, resourceId, projectId: null };
  if (!z.uuid().safeParse(input.projectId).success) {
    ctx.addIssue({ code: "custom", path: ["projectId"], message: "Choose a project." });
    return z.NEVER;
  }
  return { ...input, resourceId };
});

export type EditActivityInput = Omit<z.output<typeof editActivitySchema>, "id">;
export type ActivityField = keyof z.input<typeof editActivitySchema>;

export function readActivityForm(formData: FormData) {
  return {
    id: formData.get("id"),
    occurredOn: formData.get("occurredOn"),
    type: formData.get("type"),
    description: formData.get("description") ?? "",
    minutes: formData.get("minutes") ?? "",
    projectId: formData.get("projectId") ?? "",
    resourceId: formData.get("resourceId") ?? "",
  };
}

export const deleteActivitySchema = z.object({ id: z.uuid("Choose a valid activity.") }).strict();

export type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  minutes: number | null;
  occurredOn: string;
  project: { id: string; title: string } | null;
  resource: { id: string; title: string; url: string | null } | null;
};
