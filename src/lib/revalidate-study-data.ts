import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Topics, goals, and settings appear together across the dashboard, lists, and
 * detail pages, so a change refreshes every page under the app layout.
 */
export function revalidateStudyData() {
  revalidatePath("/", "layout");
}
