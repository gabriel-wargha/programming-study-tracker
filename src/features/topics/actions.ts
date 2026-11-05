"use server";

import { redirect } from "next/navigation";
import { archiveTopic, createTopic, updateTopic } from "@/features/topics/mutations";
import { archiveTopicSchema, editTopicSchema, topicSchema, type TopicField } from "@/features/topics/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type TopicResult = FormResult<TopicField, { id: string }>;

const topicFields = (formData: FormData) => ({
  name: formData.get("name"),
  description: formData.get("description") ?? "",
});

export async function createTopicAction(_previous: TopicResult | null, formData: FormData): Promise<TopicResult> {
  const scope = await requireScope();
  const parsed = topicSchema.safeParse(topicFields(formData));
  if (!parsed.success) return invalidInput<TopicField>(parsed.error);

  const result = await createTopic(scope, parsed.data);
  if (!result.ok) return result;
  revalidateStudyData();
  redirect(`/topics/${result.data.id}`);
}

export async function updateTopicAction(_previous: TopicResult | null, formData: FormData): Promise<TopicResult> {
  const scope = await requireScope();
  const parsed = editTopicSchema.safeParse({ ...topicFields(formData), id: formData.get("id") });
  if (!parsed.success) return invalidInput<TopicField>(parsed.error);

  const { id, ...input } = parsed.data;
  const result = await updateTopic(scope, id, input);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function archiveTopicAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = archiveTopicSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid topic." };

  const result = await archiveTopic(scope, parsed.data.id);
  if (result.ok) revalidateStudyData();
  return result;
}
