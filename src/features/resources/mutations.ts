import "server-only";

import { and, eq } from "drizzle-orm";
import { activities, resources } from "@/db/schema";
import type { ResourceField, ResourceInput } from "@/features/resources/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

type Result = FormResult<ResourceField, { id: string }>;
const notFound = { ok: false, error: "This resource could not be found." } as const;

export async function createResource({ db, userId }: UserScope, topicId: string, input: ResourceInput): Promise<Result> {
  try {
    const [resource] = await db.insert(resources).values({ userId, topicId, ...input }).returning({ id: resources.id });
    return { ok: true, data: resource };
  } catch (error) {
    if (databaseErrorCode(error) === postgresErrorCodes.foreignKeyViolation) {
      return { ok: false, error: "This topic could not be found." };
    }
    throw error;
  }
}

export async function updateResource({ db, userId }: UserScope, id: string, input: ResourceInput): Promise<Result> {
  const [resource] = await db.update(resources).set(input)
    .where(and(eq(resources.id, id), eq(resources.userId, userId))).returning({ id: resources.id });
  return resource ? { ok: true, data: resource } : notFound;
}

/** Deletes the resource and keeps any activities that used it, without the link. */
export async function deleteResource({ db, userId }: UserScope, id: string): Promise<FormResult<"id", { id: string }>> {
  return db.transaction(async (tx) => {
    const owned = and(eq(resources.id, id), eq(resources.userId, userId));
    const [existing] = await tx.select({ id: resources.id }).from(resources).where(owned);
    if (!existing) return notFound;
    await tx.update(activities).set({ resourceId: null })
      .where(and(eq(activities.resourceId, id), eq(activities.userId, userId)));
    await tx.delete(resources).where(owned);
    return { ok: true, data: existing };
  });
}
