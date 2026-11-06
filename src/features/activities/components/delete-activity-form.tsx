import { DeleteForm } from "@/components/delete-form";
import type { FormAction } from "@/lib/forms/action-state";

export function DeleteActivityForm({ action, activityId, activityName }: {
  action: FormAction<"id", { id: string }>;
  activityId: string;
  activityName: string;
}) {
  return <DeleteForm action={action} id={activityId} name={activityName} noun="activity" />;
}
