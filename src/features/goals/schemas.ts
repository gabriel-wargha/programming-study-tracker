import { z } from "zod";

export const goalStatusSchema = z.enum(["planned", "active", "completed", "archived"]);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

const goalFields = z.object({
  topicId: z.uuid("Choose a topic."),
  title: z.string().trim().min(1, "Enter a goal title.").max(160, "Use 160 characters or fewer."),
  description: z.string().trim().max(5000, "Use 5,000 characters or fewer.")
    .transform((value) => value || null),
  definitionOfDone: z.string().trim().min(1, "Describe what done looks like.")
    .max(2000, "Use 2,000 characters or fewer."),
  targetDate: z.union([z.literal(""), z.iso.date("Enter a valid calendar date.")])
    .transform((value) => value || null),
}).strict();

export const createGoalSchema = goalFields.extend({ status: z.enum(["planned", "active"]) });
export const editGoalSchema = goalFields.extend({ id: z.uuid("Choose a valid goal.") });
export const changeGoalStatusSchema = z.object({
  id: z.uuid("Choose a valid goal."),
  status: goalStatusSchema,
  confirmed: z.boolean(),
}).strict().refine((value) => value.status !== "completed" || value.confirmed, {
  path: ["confirmed"], message: "Confirm that you've met the definition of done.",
});

export type GoalField = keyof z.input<typeof createGoalSchema> | "id";
export type GoalStatusField = "id" | "status" | "confirmed";
export type GoalFormValues = {
  id?: string;
  topicId: string;
  title: string;
  description: string;
  definitionOfDone: string;
  targetDate: string;
};
export type TopicOption = { id: string; name: string };
export type GoalSummary = {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  description: string | null;
  definitionOfDone: string;
  status: GoalStatus;
  targetDate: string | null;
};
