import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { resources } from "@/db/schema";
import type { ResourceItem, ResourceOption } from "@/features/resources/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

export async function listTopicResources({ db, userId }: UserScope, topicId: string): Promise<ResourceItem[]> {
  if (!isUuid(topicId)) return [];
  return db.select({ id: resources.id, title: resources.title, url: resources.url, type: resources.type, status: resources.status })
    .from(resources)
    .where(and(eq(resources.userId, userId), eq(resources.topicId, topicId)))
    .orderBy(asc(sql`lower(${resources.title})`));
}

export async function listResourceOptions(scope: UserScope, topicId: string): Promise<ResourceOption[]> {
  return (await listTopicResources(scope, topicId)).map(({ id, title }) => ({ id, title }));
}
