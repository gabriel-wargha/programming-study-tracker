import { z } from "zod";

export const confidenceRatingSchema = z.object({
  topicId: z.uuid("Choose a valid topic."),
  rating: z.coerce.number("Choose a rating from 1 to 5.").int("Choose a rating from 1 to 5.")
    .min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
}).strict();

export type ConfidenceField = keyof z.input<typeof confidenceRatingSchema>;
export type ConfidenceEntry = { id: string; rating: number; ratedAt: Date };

export const confidenceLabels: Record<number, string> = {
  1: "Just starting", 2: "Need help often", 3: "Can do it with notes", 4: "Comfortable", 5: "Could teach it",
};
