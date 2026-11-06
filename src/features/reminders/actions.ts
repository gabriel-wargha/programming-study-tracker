"use server";

import { z } from "zod";
import { finishReminder } from "@/features/reminders/mutations";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";
import type { FormResult } from "@/lib/forms/action-state";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

const schema = z.object({ id: z.uuid() }).strict();

export async function finishReminderAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = schema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid review." };

  const { today } = await getOwnerCalendar();
  const result = await finishReminder(scope, parsed.data.id, today);
  if (result.ok) revalidateStudyData();
  return result;
}
