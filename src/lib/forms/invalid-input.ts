import type { ZodError } from "zod";
import { fieldErrors } from "@/lib/forms/field-errors";

/** The standard result for input that fails server-side validation. */
export function invalidInput<Field extends string>(error: ZodError) {
  return {
    ok: false as const,
    error: "Check the highlighted fields.",
    fieldErrors: fieldErrors(error) as Partial<Record<Field, string[]>>,
  };
}
