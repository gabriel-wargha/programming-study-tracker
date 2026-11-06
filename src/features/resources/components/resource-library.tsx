import { ExternalLink } from "@/components/external-link";
import { DeleteForm } from "@/components/delete-form";
import { EmptyState } from "@/components/page-header";
import { ResourceForm } from "@/features/resources/components/resource-form";
import { resourceStatusLabels, resourceTypeLabels, type ResourceField, type ResourceItem } from "@/features/resources/schemas";
import type { FormAction } from "@/lib/forms/action-state";

export function ResourceLibrary({ resources, updateAction, deleteAction }: {
  resources: ResourceItem[];
  updateAction: FormAction<ResourceField, { id: string }>;
  deleteAction: FormAction<"id", { id: string }>;
}) {
  if (!resources.length) {
    return (
      <EmptyState title="No resources yet" headingLevel={3}>
        <p>Save the courses, docs, videos, and books you use for this topic.</p>
      </EmptyState>
    );
  }
  return (
    <ul aria-label="Resources" className="divide-y rounded-lg border bg-card">
      {resources.map((resource) => (
        <li key={resource.id} className="space-y-2 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 font-medium wrap-break-word">
              {resource.url ? <ExternalLink href={resource.url}>{resource.title}</ExternalLink> : resource.title}
            </p>
            <p className="text-xs text-muted-foreground">{resourceTypeLabels[resource.type]}, {resourceStatusLabels[resource.status].toLowerCase()}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <details className="group w-full sm:w-auto sm:flex-1 open:rounded-lg open:border open:p-4">
              <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground group-open:mb-4 [&::-webkit-details-marker]:hidden">
                Edit<span className="sr-only">: {resource.title}</span>
              </summary>
              <ResourceForm action={updateAction} resource={resource} />
            </details>
            <DeleteForm action={deleteAction} id={resource.id} name={resource.title} noun="resource" />
          </div>
        </li>
      ))}
    </ul>
  );
}
