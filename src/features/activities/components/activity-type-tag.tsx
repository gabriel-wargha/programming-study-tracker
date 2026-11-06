import type { ActivityType } from "@/features/activities/schemas";
import { activityTypeLabels } from "@/features/activities/schemas";
import { cn } from "@/lib/utils";

/** Static class names so Tailwind can see them. */
export const activityTypeColors: Record<ActivityType, { text: string; bar: string }> = {
  course: { text: "text-type-course", bar: "bg-type-course" },
  reading: { text: "text-type-reading", bar: "bg-type-reading" },
  video: { text: "text-type-video", bar: "bg-type-video" },
  practice: { text: "text-type-practice", bar: "bg-type-practice" },
  project: { text: "text-type-project", bar: "bg-type-project" },
  other: { text: "text-type-other", bar: "bg-type-other" },
};

/** The activity type as a colored token. The label always carries the meaning; color only helps scanning. */
export function ActivityTypeTag({ type, className }: { type: ActivityType; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", activityTypeColors[type].text, className)}>
      <span aria-hidden="true" className={cn("h-3 w-1 rounded-full", activityTypeColors[type].bar)} />
      {activityTypeLabels[type]}
    </span>
  );
}
