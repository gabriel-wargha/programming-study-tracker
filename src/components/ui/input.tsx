import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const inputClassName = "w-full rounded-md border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(inputClassName, "min-h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClassName, "min-h-28 resize-y", className)} {...props} />;
}
