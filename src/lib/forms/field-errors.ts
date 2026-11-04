import type { ZodError } from "zod";

export function fieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string") (fields[field] ??= []).push(issue.message);
  }
  return fields;
}
