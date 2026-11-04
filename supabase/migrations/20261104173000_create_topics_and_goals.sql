begin;

create type public.goal_status as enum ('planned', 'active', 'completed', 'archived');

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null check (name = btrim(name) and name ~ '[^[:space:]]' and char_length(name) between 1 and 100),
  description text check (char_length(description) <= 5000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index topics_owner_name_key on public.topics (user_id, lower(name));

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  topic_id uuid not null,
  title text not null check (title = btrim(title) and title ~ '[^[:space:]]' and char_length(title) between 1 and 160),
  description text check (char_length(description) <= 5000),
  definition_of_done text not null check (
    definition_of_done = btrim(definition_of_done)
    and definition_of_done ~ '[^[:space:]]'
    and char_length(definition_of_done) between 1 and 2000
  ),
  status public.goal_status not null default 'planned',
  target_date date,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint goals_owned_topic_fkey foreign key (topic_id, user_id)
    references public.topics (id, user_id),
  constraint goals_completion_timestamp_check check (
    (status = 'completed' and completed_at is not null)
    or (status in ('planned', 'active') and completed_at is null)
    or status = 'archived'
  )
);
create index goals_owner_status_idx on public.goals (user_id, status);
create index goals_topic_idx on public.goals (topic_id, user_id);

alter table public.topics enable row level security;
alter table public.goals enable row level security;

revoke all on public.topics, public.goals from anon, authenticated;
grant select on public.topics, public.goals to authenticated;
grant insert (user_id, name, description) on public.topics to authenticated;
grant update (name, description, archived_at) on public.topics to authenticated;
grant insert (user_id, topic_id, title, description, definition_of_done, status, target_date)
  on public.goals to authenticated;
grant update (topic_id, title, description, definition_of_done, status, target_date)
  on public.goals to authenticated;

create policy "Owners can read topics" on public.topics for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can create topics" on public.topics for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners can update topics" on public.topics for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can read goals" on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can create goals" on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners can update goals" on public.goals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.guard_goal_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  topic_archived_at timestamptz;
  goal_limit integer;
  active_count integer;
  was_active boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.status not in ('planned', 'active') then
      raise exception 'New goals must be planned or active' using errcode = '23514';
    end if;
    new.started_at := null;
    new.completed_at := null;
  else
    was_active := old.status = 'active';
    if new.id <> old.id or new.user_id <> old.user_id then
      raise exception 'Goal ownership cannot change' using errcode = '42501';
    end if;
    if new.status <> old.status and not (
      (old.status = 'planned' and new.status in ('active', 'archived'))
      or (old.status = 'active' and new.status in ('planned', 'completed', 'archived'))
      or (old.status = 'completed' and new.status in ('active', 'archived'))
    ) then
      raise exception 'Invalid goal status change' using errcode = '23514';
    end if;
    new.started_at := old.started_at;
    new.completed_at := old.completed_at;
  end if;

  -- Topic archiving and goal activation must agree on the same locked row.
  select archived_at into topic_archived_at from public.topics
    where id = new.topic_id and user_id = new.user_id for update;
  if not found then
    raise exception 'Choose a topic you own' using errcode = '23503';
  end if;
  if topic_archived_at is not null then
    if tg_op = 'INSERT' or new.status = 'active' then
      raise exception 'Archived topics cannot receive new or active goals' using errcode = '23514';
    elsif new.topic_id <> old.topic_id then
      raise exception 'Goals cannot move to an archived topic' using errcode = '23514';
    end if;
  end if;

  if new.status = 'active' or was_active then
    -- Write the profile row, rather than only locking it. This serializes slot
    -- allocation across topics and forces stale repeatable-read writers to retry.
    update public.profiles set active_goal_limit = active_goal_limit
      where user_id = new.user_id returning active_goal_limit into goal_limit;
    if not found then
      raise exception 'A profile is required' using errcode = '23503';
    end if;
  end if;

  if new.status = 'active' then
    select count(*) into active_count from public.goals
      where user_id = new.user_id and status = 'active' and id <> new.id;
    if active_count >= goal_limit then
      raise exception 'Active goal limit reached' using errcode = 'P0001';
    end if;
    new.started_at := coalesce(new.started_at, now());
    new.completed_at := null;
  elsif new.status = 'completed' then
    if tg_op = 'UPDATE' and old.status <> 'completed' then
      new.completed_at := now();
    end if;
  end if;
  return new;
end;
$$;

create function public.guard_topic_archive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.archived_at is null and new.archived_at is not null then
    if exists (select 1 from public.goals
      where topic_id = new.id and user_id = new.user_id and status = 'active') then
      raise exception 'A topic with active goals cannot be archived' using errcode = 'P0001';
    end if;
    new.archived_at := now();
  end if;
  return new;
end;
$$;

create function public.guard_active_goal_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.active_goal_limit < old.active_goal_limit then
    if (select count(*) from public.goals
      where user_id = new.user_id and status = 'active') > new.active_goal_limit then
      raise exception 'Move active goals to planned before lowering this limit' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger goals_guard_changes before insert or update on public.goals
  for each row execute function public.guard_goal_changes();
create trigger topics_guard_archive before update of archived_at on public.topics
  for each row execute function public.guard_topic_archive();
create trigger profiles_guard_active_goal_limit before update of active_goal_limit on public.profiles
  for each row execute function public.guard_active_goal_limit();
create trigger topics_set_updated_at before update on public.topics
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

commit;
