import { z } from "zod";

export const activeGoalLimitSchema = z.object({
  activeGoalLimit: z.string().regex(/^(?:[1-9]|10)$/, "Choose a whole number from 1 to 10.")
    .transform(Number),
}).strict();
