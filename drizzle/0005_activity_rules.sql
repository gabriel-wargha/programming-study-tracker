-- Activity and project rules that must hold however the database is written to.
--
-- Custom SQLSTATE codes (see src/lib/db/errors.ts):
--   SL006 ownership cannot change (also used by topics and goals)
--   SL007 only active goals can receive new activities
--   SL008 activity dates cannot be in the future
--
-- "The future" is measured against the earliest time zone on Earth (UTC+14),
-- because the database does not know the owner's time zone. Server code checks
-- the same bound, and the browser form checks the owner's own local date.

CREATE FUNCTION public.guard_activity_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  goal_status public.goal_status;
BEGIN
  IF tg_op = 'INSERT' THEN
    -- Share-lock the goal so it cannot leave `active` while the row is added.
    SELECT status INTO goal_status FROM public.goals
      WHERE id = new.goal_id AND user_id = new.user_id FOR SHARE;
    IF NOT found THEN
      RAISE EXCEPTION 'Choose a goal you own' USING errcode = '23503';
    END IF;
    IF goal_status <> 'active' THEN
      RAISE EXCEPTION 'Only active goals can receive new activities' USING errcode = 'SL007';
    END IF;
  ELSIF new.id <> old.id OR new.user_id <> old.user_id OR new.goal_id <> old.goal_id THEN
    RAISE EXCEPTION 'Activity ownership cannot change' USING errcode = 'SL006';
  END IF;

  IF (tg_op = 'INSERT' OR new.occurred_on <> old.occurred_on)
    AND new.occurred_on > (now() AT TIME ZONE 'Pacific/Kiritimati')::date THEN
    RAISE EXCEPTION 'Activity dates cannot be in the future' USING errcode = 'SL008';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_project_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.id <> old.id OR new.user_id <> old.user_id THEN
    RAISE EXCEPTION 'Project ownership cannot change' USING errcode = 'SL006';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER activities_guard_changes BEFORE INSERT OR UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_activity_changes();
--> statement-breakpoint
CREATE TRIGGER projects_guard_changes BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_project_changes();
--> statement-breakpoint
CREATE TRIGGER activities_set_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
