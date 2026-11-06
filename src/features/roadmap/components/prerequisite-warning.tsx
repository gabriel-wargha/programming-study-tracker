import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { RoadmapTopic } from "@/features/roadmap/order";

/** Warns about unfinished prerequisites. It never blocks a goal. */
export function PrerequisiteWarning({ prerequisites }: { prerequisites: RoadmapTopic[] }) {
  if (!prerequisites.length) return null;
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg border border-type-practice/30 bg-type-practice/5 px-4 py-3 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-type-practice" />
      <p>
        <span className="font-semibold text-type-practice">Unfinished prerequisites:</span>{" "}
        {prerequisites.map((topic, index) => (
          <span key={topic.id}>
            {index > 0 && ", "}
            <Link href={`/topics/${topic.id}`} className="font-medium underline underline-offset-4">{topic.name}</Link>
          </span>
        ))}
        . You can still work on this, but learning those first may help.
      </p>
    </div>
  );
}
