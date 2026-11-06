"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import {
  portfolioSettingsSchema, readPortfolioForm, type PortfolioField, type PortfolioFormValues,
} from "@/features/portfolio/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";

type Data = { slug: string | null };
type Result = FormResult<PortfolioField, Data>;

export function PortfolioForm({ action, initialValues }: { action: FormAction<PortfolioField, Data>; initialValues: PortfolioFormValues }) {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const parsed = portfolioSettingsSchema.safeParse(readPortfolioForm(formData));
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const result = await action(previous, formData);
    if (result.ok) setSaved(values);
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const update = (field: Exclude<keyof PortfolioFormValues, "enabled">, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const describedBy = (field: PortfolioField, hint?: string) =>
    [hint, errors?.[field] ? `${id}-${field}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label="Portfolio settings" className="space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="enabled" checked={values.enabled} onChange={(event) => setValues({ ...values, enabled: event.target.checked })} className="mt-0.5 size-5 shrink-0 accent-primary" />
          <span>
            <span className="font-medium">Turn on my public portfolio</span>
            <span className="mt-0.5 block text-muted-foreground">Anyone with the link can see the goals and projects you mark public. Nothing else is shared.</span>
          </span>
        </label>
        <div>
          <label htmlFor={`${id}-slug`} className="text-sm font-medium">Page address</label>
          <p id={`${id}-slug-hint`} className="mt-1 text-sm text-muted-foreground">Your page will be at <span className="font-mono text-[0.8125rem]">/u/{values.slug || "your-name"}</span></p>
          <Input id={`${id}-slug`} name="slug" maxLength={60} autoCapitalize="none" spellCheck={false} value={values.slug} onChange={(event) => update("slug", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.slug)} aria-describedby={describedBy("slug", `${id}-slug-hint`)} />
          <FieldError id={`${id}-slug-error`} errors={errors?.slug} />
        </div>
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium">Display name <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-name`} name="displayName" maxLength={100} value={values.displayName} onChange={(event) => update("displayName", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.displayName)} aria-describedby={describedBy("displayName")} />
          <FieldError id={`${id}-displayName-error`} errors={errors?.displayName} />
        </div>
        <div>
          <label htmlFor={`${id}-headline`} className="text-sm font-medium">Headline <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-headline`} name="headline" maxLength={200} value={values.headline} onChange={(event) => update("headline", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.headline)} aria-describedby={describedBy("headline")} />
          <FieldError id={`${id}-headline-error`} errors={errors?.headline} />
        </div>
        <div>
          <label htmlFor={`${id}-github`} className="text-sm font-medium">GitHub username <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-github`} name="githubUsername" maxLength={39} autoCapitalize="none" spellCheck={false} value={values.githubUsername} onChange={(event) => update("githubUsername", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.githubUsername)} aria-describedby={describedBy("githubUsername")} />
          <FieldError id={`${id}-githubUsername-error`} errors={errors?.githubUsername} />
        </div>
      </fieldset>
      <FormFeedback state={state} success="Portfolio settings saved." />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save portfolio"}</Button>
        {saved.enabled && saved.slug && <Link href={`/u/${saved.slug}`} className="text-sm font-medium text-primary underline underline-offset-4">View my portfolio</Link>}
      </div>
    </form>
  );
}
