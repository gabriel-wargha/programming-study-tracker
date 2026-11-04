begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'profile-a@example.test',
   '{"full_name":"Study Owner","user_name":"study-owner"}'),
  ('22222222-2222-4222-8222-222222222222', 'profile-b@example.test', '{}');

select is((select count(*) from public.profiles), 2::bigint,
  'The new-user trigger creates both profiles');
select is((select github_username from public.profiles
  where id = '11111111-1111-4111-8111-111111111111'), 'study-owner',
  'The trigger copies the GitHub username');
select is((select active_goal_limit::integer from public.profiles
  where id = '11111111-1111-4111-8111-111111111111'), 3,
  'The active goal limit defaults to three');

update public.profiles set updated_at = now() - interval '1 day'
  where id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select is((select count(*) from public.profiles), 1::bigint,
  'An owner can read only their profile');
select is((select display_name from public.profiles
  where id = '11111111-1111-4111-8111-111111111111'), 'Study Owner',
  'An owner can read their own profile');
select is((select count(*) from public.profiles
  where id = '22222222-2222-4222-8222-222222222222'), 0::bigint,
  'An owner cannot read another profile');

with changed as (
  update public.profiles set display_name = 'Unauthorized'
  where id = '22222222-2222-4222-8222-222222222222'
  returning id
)
select is((select count(*) from changed), 0::bigint,
  'An owner cannot change another profile');

update public.profiles set display_name = 'Updated Owner', active_goal_limit = 5
  where id = '11111111-1111-4111-8111-111111111111';
select is((select active_goal_limit::integer from public.profiles), 5,
  'An owner can update their own settings');
select ok((select updated_at = now() from public.profiles),
  'Updating a profile maintains updated_at');
select throws_ok(
  $$update public.profiles set active_goal_limit = 0$$,
  '23514', null, 'The goal limit cannot be below one');
select throws_ok(
  $$update public.profiles set active_goal_limit = 11$$,
  '23514', null, 'The goal limit cannot exceed ten');
select throws_ok(
  $$update public.profiles set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'An owner cannot change profile ownership');
select throws_ok(
  $$delete from public.profiles where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'An owner cannot delete another profile');

select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select is((select count(*) from public.profiles), 0::bigint,
  'A request without a verified user ID cannot read profiles');

select * from finish();
rollback;
