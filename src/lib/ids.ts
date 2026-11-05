import { z } from "zod";

const uuidSchema = z.uuid();

/** Route params are untrusted; a malformed ID is treated as not found. */
export function isUuid(value: unknown): value is string {
  return uuidSchema.safeParse(value).success;
}
