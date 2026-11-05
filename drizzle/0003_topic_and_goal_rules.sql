-- Topic and goal rules that must hold however the database is written to.
-- Ported from the Phase 2 Supabase draft (commit edfa92c), minus RLS and grants.
--
-- Custom SQLSTATE codes let server code map failures to messages:
--   SL001 active goal limit reached
--   SL002 a topic with active goals cannot be archived
--   SL003 the limit cannot go below the current number of active goals
--   SL004 archived topics cannot receive new, moved, or active goals
--   SL005 invalid goal status change (including new goals that are not planned or active)
--   SL006 ownership cannot change

CREATE FUNCTION public.guard_goal_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  topic_archived_at timestamptz;
  goal_limit integer;
  active_count integer;
  was_active boolean := false;
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.status NOT IN ('planned', 'active') THEN
      RAISE EXCEPTION 'New goals must be planned or active' USING errcode = 'SL005';
    END IF;
    new.started_at := NULL;
    new.completed_at := NULL;
  ELSE
    was_active := old.status = 'active';
    IF new.id <> old.id OR new.user_id <> old.user_id THEN
      RAISE EXCEPTION 'Goal ownership cannot change' USING errcode = 'SL006';
    END IF;
    IF new.status <> old.status AND NOT (
      (old.status = 'planned' AND new.status IN ('active', 'archived'))
      OR (old.status = 'active' AND new.status IN ('planned', 'completed', 'archived'))
      OR (old.status = 'completed' AND new.status IN ('active', 'archived'))
    ) THEN
      RAISE EXCEPTION 'Invalid goal status change' USING errcode = 'SL005';
    END IF;
    -- Timestamps are owned by this trigger, never by the caller.
    new.started_at := old.started_at;
    new.completed_at := old.completed_at;
  END IF;

  -- Topic archiving and goal activation agree on the same locked topic row.
  SELECT archived_at INTO topic_archived_at FROM public.topics
    WHERE id = new.topic_id AND user_id = new.user_id FOR UPDATE;
  IF NOT found THEN
    RAISE EXCEPTION 'Choose a topic you own' USING errcode = '23503';
  END IF;
  IF topic_archived_at IS NOT NULL THEN
    IF tg_op = 'INSERT' OR new.status = 'active' THEN
      RAISE EXCEPTION 'Archived topics cannot receive new or active goals' USING errcode = 'SL004';
    ELSIF new.topic_id <> old.topic_id THEN
      RAISE EXCEPTION 'Goals cannot move to an archived topic' USING errcode = 'SL004';
    END IF;
  END IF;

  IF new.status = 'active' OR was_active THEN
    -- Write the profile row, rather than only locking it. This serializes slot
    -- allocation across topics and forces stale repeatable-read writers to retry.
    UPDATE public.profiles SET active_goal_limit = active_goal_limit
      WHERE user_id = new.user_id RETURNING active_goal_limit INTO goal_limit;
    IF NOT found THEN
      RAISE EXCEPTION 'A profile is required' USING errcode = '23503';
    END IF;
  END IF;

  IF new.status = 'active' THEN
    SELECT count(*) INTO active_count FROM public.goals
      WHERE user_id = new.user_id AND status = 'active' AND id <> new.id;
    IF active_count >= goal_limit THEN
      RAISE EXCEPTION 'Active goal limit reached' USING errcode = 'SL001';
    END IF;
    new.started_at := coalesce(new.started_at, now());
    new.completed_at := NULL;
  ELSIF new.status = 'completed' AND tg_op = 'UPDATE' AND old.status <> 'completed' THEN
    new.completed_at := now();
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_topic_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.id <> old.id OR new.user_id <> old.user_id THEN
    RAISE EXCEPTION 'Topic ownership cannot change' USING errcode = 'SL006';
  END IF;
  IF old.archived_at IS NULL AND new.archived_at IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.goals
      WHERE topic_id = new.id AND user_id = new.user_id AND status = 'active') THEN
      RAISE EXCEPTION 'A topic with active goals cannot be archived' USING errcode = 'SL002';
    END IF;
    new.archived_at := now();
  ELSIF old.archived_at IS NOT NULL AND new.archived_at IS NOT NULL THEN
    new.archived_at := old.archived_at;
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_active_goal_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.active_goal_limit < old.active_goal_limit AND (
    SELECT count(*) FROM public.goals WHERE user_id = new.user_id AND status = 'active'
  ) > new.active_goal_limit THEN
    RAISE EXCEPTION 'Move active goals to planned before lowering this limit' USING errcode = 'SL003';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER goals_guard_changes BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.guard_goal_changes();
--> statement-breakpoint
CREATE TRIGGER topics_guard_changes BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.guard_topic_changes();
--> statement-breakpoint
CREATE TRIGGER profiles_guard_active_goal_limit BEFORE UPDATE OF active_goal_limit ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_active_goal_limit();
--> statement-breakpoint
CREATE TRIGGER topics_set_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER goals_set_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
