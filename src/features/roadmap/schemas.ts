import { z } from "zod";

export const prerequisiteSchema = z.object({
  topicId: z.uuid("Choose a valid topic."),
  prerequisiteTopicId: z.uuid("Choose a topic."),
}).strict();

export type PrerequisiteField = keyof z.input<typeof prerequisiteSchema>;
