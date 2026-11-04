import { z } from "zod";

export const topicSchema = z.object({
  name: z.string().trim().min(1, "Enter a topic name.").max(100, "Use 100 characters or fewer."),
  description: z.string().trim().max(5000, "Use 5,000 characters or fewer.")
    .transform((value) => value || null),
}).strict();

export const editTopicSchema = topicSchema.extend({ id: z.uuid("Choose a valid topic.") });
export const archiveTopicSchema = z.object({ id: z.uuid("Choose a valid topic.") }).strict();

export type TopicField = keyof z.input<typeof editTopicSchema>;
export type TopicFormValues = { id?: string; name: string; description: string };
export type TopicSummary = {
  id: string;
  name: string;
  description: string | null;
  goalCount: number;
  archived: boolean;
};
