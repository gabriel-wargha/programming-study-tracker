-- Rules for resources, blockers, and the topic roadmap.
--
-- Custom SQLSTATE codes (see src/lib/db/errors.ts):
--   SL006 ownership cannot change
--   SL009 an activity can link only to a resource from its goal's topic
--   SL010 a topic prerequisite cannot create a loop

CREATE FUNCTION public.guard_activity_resource()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.resource_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.resources r
      JOIN public.goals g ON g.topic_id = r.topic_id AND g.user_id = r.user_id
      WHERE r.id = new.resource_id AND r.user_id = new.user_id AND g.id = new.goal_id
  ) THEN
    RAISE EXCEPTION 'Choose a resource from this goal''s topic' USING errcode = 'SL009';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_resource_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF new.id <> old.id OR new.user_id <> old.user_id OR new.topic_id <> old.topic_id THEN
    RAISE EXCEPTION 'Resource ownership cannot change' USING errcode = 'SL006';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_blocker_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    new.solved_at := CASE WHEN new.status = 'solved' THEN now() END;
    RETURN new;
  END IF;
  IF new.id <> old.id OR new.user_id <> old.user_id OR new.goal_id <> old.goal_id THEN
    RAISE EXCEPTION 'Blocker ownership cannot change' USING errcode = 'SL006';
  END IF;
  -- solved_at is owned by this trigger, never by the caller.
  IF new.status = 'solved' AND old.status <> 'solved' THEN
    new.solved_at := now();
  ELSIF new.status = 'solved' THEN
    new.solved_at := old.solved_at;
  ELSE
    new.solved_at := NULL;
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.guard_topic_prerequisite()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Serialize roadmap edits per owner so two concurrent inserts can't form a loop together.
  PERFORM 1 FROM public.profiles WHERE user_id = new.user_id FOR UPDATE;
  IF EXISTS (
    WITH RECURSIVE reachable AS (
      SELECT prerequisite_topic_id AS topic_id FROM public.topic_prerequisites
        WHERE topic_id = new.prerequisite_topic_id AND user_id = new.user_id
      UNION
      SELECT p.prerequisite_topic_id FROM public.topic_prerequisites p
        JOIN reachable ON p.topic_id = reachable.topic_id
        WHERE p.user_id = new.user_id
    )
    SELECT 1 FROM reachable WHERE topic_id = new.topic_id
  ) THEN
    RAISE EXCEPTION 'This prerequisite would create a loop' USING errcode = 'SL010';
  END IF;
  RETURN new;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER activities_guard_resource BEFORE INSERT OR UPDATE OF resource_id ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.guard_activity_resource();
--> statement-breakpoint
CREATE TRIGGER resources_guard_changes BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.guard_resource_changes();
--> statement-breakpoint
CREATE TRIGGER blockers_guard_changes BEFORE INSERT OR UPDATE ON public.blockers
  FOR EACH ROW EXECUTE FUNCTION public.guard_blocker_changes();
--> statement-breakpoint
CREATE TRIGGER topic_prerequisites_guard BEFORE INSERT OR UPDATE ON public.topic_prerequisites
  FOR EACH ROW EXECUTE FUNCTION public.guard_topic_prerequisite();
--> statement-breakpoint
CREATE TRIGGER resources_set_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER blockers_set_updated_at BEFORE UPDATE ON public.blockers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
