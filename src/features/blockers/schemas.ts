import { z } from "zod";

export const createBlockerSchema = z.object({
  goalId: z.uuid("Choose a valid goal."),
  title: z.string().trim().min(1, "Describe the problem.").max(160, "Use 160 characters or fewer."),
  details: z.string().trim().max(5000, "Use 5,000 characters or fewer.").transform((value) => value || null),
}).strict();
export const solveBlockerSchema = z.object({
  id: z.uuid("Choose a valid blocker."),
  solution: z.string().trim().min(1, "Describe how you solved it.").max(5000, "Use 5,000 characters or fewer."),
}).strict();
export const reopenBlockerSchema = z.object({ id: z.uuid("Choose a valid blocker.") }).strict();

export type BlockerField = "goalId" | "title" | "details";
export type SolveField = "id" | "solution";
export type BlockerItem = {
  id: string;
  title: string;
  details: string | null;
  status: "open" | "solved";
  solution: string | null;
  solvedAt: Date | null;
  createdAt: Date;
};
