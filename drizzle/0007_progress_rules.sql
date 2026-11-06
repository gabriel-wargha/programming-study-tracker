-- Totals per goal for the dashboard, stalled alerts, and later phases.
-- security_invoker keeps the caller's own permissions in force.
CREATE VIEW public.goal_activity_summary WITH (security_invoker = true) AS
  SELECT
    goal_id,
    user_id,
    max(occurred_on) AS last_activity_on,
    count(*)::integer AS activity_count,
    coalesce(sum(minutes), 0)::integer AS total_minutes
  FROM public.activities
  GROUP BY goal_id, user_id;
--> statement-breakpoint
-- Ratings are a history: rows can be added but never changed.
CREATE FUNCTION public.guard_confidence_rating_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Confidence ratings cannot be changed' USING errcode = 'SL006';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER confidence_ratings_guard_changes BEFORE UPDATE ON public.confidence_ratings
  FOR EACH ROW EXECUTE FUNCTION public.guard_confidence_rating_changes();
