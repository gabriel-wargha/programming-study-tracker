begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'goals-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'goals-b@example.test');
insert into public.topics (id, user_id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'React'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'React');
insert into public.goals (id, user_id, topic_id, title, definition_of_done, status) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'First goal', 'Ship a keyboard accessible form', 'planned'),
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Private goal', 'Keep this private', 'active');

-- Arrange a previously started, now planned goal. Also test the composite FK
-- independently of the lifecycle trigger, with RLS and grants still enabled.
alter table public.goals disable trigger goals_guard_changes;
update public.goals set started_at = now() - interval '1 day'
  where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done)
    values ('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Cross owner', 'Invalid')$$,
  '23503', null, 'The composite foreign key rejects another owner''s topic');
reset role;
alter table public.goals enable trigger goals_guard_changes;
set local role authenticated;

select is((select count(*) from public.topics), 1::bigint, 'An owner sees only their topics');
select is((select count(*) from public.goals), 1::bigint, 'An owner sees only their goals');
select is((select count(*) from public.topics where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'Another topic is private');
select is((select count(*) from public.goals where id = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb'), 0::bigint, 'Another goal is private');
with changed as (
  update public.topics set name = 'Stolen' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning id
) select is((select count(*) from changed), 0::bigint, 'Another topic cannot be changed');
with changed as (
  update public.goals set title = 'Stolen' where id = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb' returning id
) select is((select count(*) from changed), 0::bigint, 'Another goal cannot be changed');
select throws_ok(
  $$insert into public.topics (user_id, name) values ('22222222-2222-4222-8222-222222222222', 'Forged')$$,
  '42501', null, 'A browser cannot create a topic for another owner');
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done)
    values ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Forged', 'Invalid')$$,
  '23503', null, 'A browser cannot create a goal for another owner');
select throws_ok(
  $$update public.topics set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'Topic ownership cannot be reassigned');
select throws_ok(
  $$update public.goals set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'Goal ownership cannot be reassigned');
select throws_ok($$delete from public.topics$$, '42501', null, 'Topics cannot be permanently deleted from the browser');
select throws_ok($$delete from public.goals$$, '42501', null, 'Goals cannot be permanently deleted from the browser');
select throws_ok(
  $$insert into public.topics (user_id, name) values ('11111111-1111-4111-8111-111111111111', 'react')$$,
  '23505', null, 'Topic names are unique per owner regardless of capitalization');
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done)
    values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Empty finish line', ' ')$$,
  '23514', null, 'A definition of done is required in the database');
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done, status)
    values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Already complete', 'Invalid', 'completed')$$,
  '23514', null, 'New goals cannot start completed');

update public.profiles set active_goal_limit = 1;
select lives_ok($$update public.goals set status = 'active' where title = 'First goal'$$,
  'A planned goal can become active when a slot is available');
select ok((select started_at = now() - interval '1 day' from public.goals where title = 'First goal'),
  'Reactivating preserves the original start timestamp');
select lives_ok($$update public.goals set title = 'First goal edited' where title = 'First goal'$$,
  'Editing an active goal at the limit does not consume another slot');
select lives_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done)
    values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Second goal', 'Ship another form')$$,
  'A planned goal can still be created at the active limit');
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done, status)
    values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Overflow', 'Invalid', 'active')$$,
  'P0001', 'Active goal limit reached', 'Direct inserts cannot bypass the active limit');
select throws_ok($$update public.goals set status = 'active' where title = 'Second goal'$$,
  'P0001', 'Active goal limit reached', 'Direct updates cannot bypass the active limit');
select throws_ok($$update public.topics set archived_at = now()$$,
  'P0001', null, 'Topics with active goals cannot be archived');
select throws_ok($$update public.goals set started_at = now()$$,
  '42501', null, 'Browser clients cannot forge start timestamps');
select throws_ok($$update public.goals set completed_at = now()$$,
  '42501', null, 'Browser clients cannot forge completion timestamps');

update public.profiles set active_goal_limit = 2;
select lives_ok($$update public.goals set status = 'active' where title = 'Second goal'$$,
  'Raising the limit makes a slot available');
select ok((select started_at is not null from public.goals where title = 'Second goal'),
  'First activation records a start timestamp');
select throws_ok($$update public.profiles set active_goal_limit = 1$$,
  'P0001', null, 'The limit cannot be lowered below the number of active goals');
select lives_ok($$update public.goals set status = 'completed' where title = 'First goal edited'$$,
  'An active goal can be completed');
select ok((select completed_at is not null from public.goals where title = 'First goal edited'),
  'Completion records its timestamp');
select lives_ok($$update public.goals set status = 'active' where title = 'First goal edited'$$,
  'A completed goal can be reopened when there is room');
select ok((select completed_at is null from public.goals where title = 'First goal edited'),
  'Reopening clears the completion timestamp');
update public.goals set status = 'completed' where title = 'First goal edited';
update public.profiles set active_goal_limit = 1;
select throws_ok($$update public.goals set status = 'active' where title = 'First goal edited'$$,
  'P0001', null, 'Reopening cannot bypass a full active limit');
select lives_ok($$update public.goals set status = 'planned' where title = 'Second goal'$$,
  'An active goal can return to planned');
select lives_ok($$update public.topics set archived_at = now()$$,
  'A topic without active goals can be archived');
select throws_ok($$update public.goals set status = 'active' where title = 'Second goal'$$,
  '23514', null, 'Goals cannot become active under archived topics');
select throws_ok(
  $$insert into public.goals (user_id, topic_id, title, definition_of_done)
    values ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Archived destination', 'Invalid')$$,
  '23514', null, 'Archived topics cannot receive new goals');
select lives_ok($$update public.goals set status = 'archived' where title = 'First goal edited'$$,
  'Completed goals can be archived');
select throws_ok($$update public.goals set status = 'planned' where title = 'First goal edited'$$,
  '23514', null, 'Archived goals have no status transitions');

set local role anon;
select throws_ok($$select * from public.topics$$, '42501', null, 'Public visitors cannot read topics');
select throws_ok($$select * from public.goals$$, '42501', null, 'Public visitors cannot read goals');
select * from finish();
rollback;
