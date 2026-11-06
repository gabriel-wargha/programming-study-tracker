import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { addPrerequisiteAction, removePrerequisiteAction } from "@/features/roadmap/actions";
import { RoadmapView } from "@/features/roadmap/components/roadmap-view";
import { getRoadmap } from "@/features/roadmap/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Roadmap · Programming Study Tracker" };

export default async function RoadmapPage() {
  const { stages, options, edges } = await getRoadmap(await requireScope());
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Roadmap"
        description="Which topics to learn first. A prerequisite counts as finished once it has a completed goal."
      />
      <RoadmapView stages={stages} options={options} edges={edges} addAction={addPrerequisiteAction} removeAction={removePrerequisiteAction} />
    </div>
  );
}
