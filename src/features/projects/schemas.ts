import { z } from "zod";
import { httpsUrlSchema, optionalHttpsUrlSchema } from "@/lib/urls";

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Enter a project title.").max(160, "Use 160 characters or fewer."),
  repoUrl: httpsUrlSchema("Enter the repository URL."),
  liveUrl: optionalHttpsUrlSchema(),
  description: z.string().trim().max(5000, "Use 5,000 characters or fewer.")
    .transform((value) => value || null),
}).strict();

export const editProjectSchema = projectSchema.extend({ id: z.uuid("Choose a valid project.") });

export type ProjectInput = z.output<typeof projectSchema>;
export type ProjectField = keyof z.input<typeof editProjectSchema>;
export type ProjectFormValues = { id?: string; title: string; repoUrl: string; liveUrl: string; description: string };
export type ProjectOption = { id: string; title: string };
export type ProjectSummary = {
  id: string;
  title: string;
  description: string | null;
  repoUrl: string;
  liveUrl: string | null;
  activityCount: number;
  goalCount: number;
  lastActivityOn: string | null;
};
export type ProjectGoal = { id: string; title: string; topicName: string; activityCount: number; totalMinutes: number };

export function readProjectForm(formData: FormData) {
  return {
    title: formData.get("title"),
    repoUrl: formData.get("repoUrl"),
    liveUrl: formData.get("liveUrl") ?? "",
    description: formData.get("description") ?? "",
  };
}
