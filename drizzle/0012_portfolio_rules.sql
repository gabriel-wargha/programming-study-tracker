-- Reminder and portfolio rules that must hold however the database is written to.
--
-- Custom SQLSTATE codes (see src/lib/db/errors.ts):
--   SL006 ownership cannot change
--   SL011 only completed goals can be public
--
-- This trigger's name sorts after goals_guard_changes, so it sees the final status.

CREATE FUNCTION public.guard_goal_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.is_public AND new.status <> 'completed' THEN
    IF tg_op = 'UPDATE' AND old.is_public THEN
      -- A public goal that is reopened or archived goes back to private on its own.
      new.is_public := false;
    ELSE
      RAISE EXCEPTION 'Only completed goals can be public' USING errcode = 'SL011';
    END IF;
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_reminder_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.id <> old.id OR new.user_id <> old.user_id OR new.goal_id <> old.goal_id OR new.stage <> old.stage THEN
    RAISE EXCEPTION 'Reminder ownership cannot change' USING errcode = 'SL006';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER goals_guard_visibility BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.guard_goal_visibility();
--> statement-breakpoint
CREATE TRIGGER review_reminders_guard_changes BEFORE UPDATE ON public.review_reminders
  FOR EACH ROW EXECUTE FUNCTION public.guard_reminder_changes();
--> statement-breakpoint
CREATE TRIGGER review_reminders_set_updated_at BEFORE UPDATE ON public.review_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
