import { z } from "zod";
import { optionalHttpsUrlSchema } from "@/lib/urls";

export const resourceTypes = ["course", "docs", "video", "article", "book", "other"] as const;
export const resourceStatuses = ["to_do", "in_progress", "finished"] as const;
export type ResourceType = (typeof resourceTypes)[number];
export type ResourceStatus = (typeof resourceStatuses)[number];

export const resourceTypeLabels: Record<ResourceType, string> = {
  course: "Course", docs: "Docs", video: "Video", article: "Article", book: "Book", other: "Other",
};
export const resourceStatusLabels: Record<ResourceStatus, string> = {
  to_do: "To do", in_progress: "In progress", finished: "Finished",
};

const resourceFields = {
  title: z.string().trim().min(1, "Enter a resource title.").max(200, "Use 200 characters or fewer."),
  url: optionalHttpsUrlSchema(),
  type: z.enum(resourceTypes, "Choose a type."),
  status: z.enum(resourceStatuses, "Choose a status."),
};
export const createResourceSchema = z.object({ ...resourceFields, topicId: z.uuid("Choose a valid topic.") }).strict();
export const editResourceSchema = z.object({ ...resourceFields, id: z.uuid("Choose a valid resource.") }).strict();
export const deleteResourceSchema = z.object({ id: z.uuid("Choose a valid resource.") }).strict();

export type ResourceInput = { title: string; url: string | null; type: ResourceType; status: ResourceStatus };
export type ResourceField = "title" | "url" | "type" | "status" | "topicId" | "id";
export type ResourceItem = ResourceInput & { id: string };
export type ResourceOption = { id: string; title: string };

export function readResourceForm(formData: FormData) {
  return {
    title: formData.get("title"),
    url: formData.get("url") ?? "",
    type: formData.get("type"),
    status: formData.get("status"),
  };
}
