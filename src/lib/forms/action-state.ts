export type ActiveGoalLink = { id: string; title: string };

export type FormResult<Field extends string, Data> =
  | { ok: true; data: Data }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<Field, string[]>>;
      activeGoals?: ActiveGoalLink[];
    };

export type FormAction<Field extends string, Data> = (
  previous: FormResult<Field, Data> | null,
  formData: FormData,
) => Promise<FormResult<Field, Data>>;
