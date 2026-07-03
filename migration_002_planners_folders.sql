-- Migration 002: Planners + Folders
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Prerequisite: schema.sql must already be applied.
--
-- This is additive and safe to run on a project that already has real user
-- data: it creates the new tables, backfills a default planner for every
-- existing user so their current tasks/notes/meetings/timeline/daily_state
-- aren't orphaned, then locks planner_id as required going forward.

-- ---------------------------------------------------------------------
-- Folders
-- ---------------------------------------------------------------------
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table folders enable row level security;

create policy "Users can view their own folders"
  on folders for select using (auth.uid() = user_id);
create policy "Users can insert their own folders"
  on folders for insert with check (auth.uid() = user_id);
create policy "Users can update their own folders"
  on folders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own folders"
  on folders for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Planners — one row per saved planner. folder_id is nullable and set to
-- null (not cascaded) on folder deletion, so deleting a folder un-files
-- the planners inside it rather than destroying them.
-- ---------------------------------------------------------------------
create table if not exists planners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null default 'Untitled planner',
  template_id text not null default 'dashboard',
  layout jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table planners enable row level security;

create policy "Users can view their own planners"
  on planners for select using (auth.uid() = user_id);
create policy "Users can insert their own planners"
  on planners for insert with check (auth.uid() = user_id);
create policy "Users can update their own planners"
  on planners for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own planners"
  on planners for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Add planner_id to existing data tables. Nullable at first — this is the
-- safe order for an additive migration on a table that may already have
-- rows: add the column, backfill it, THEN enforce not-null.
-- ---------------------------------------------------------------------
alter table tasks add column if not exists planner_id uuid references planners(id) on delete cascade;
alter table meetings add column if not exists planner_id uuid references planners(id) on delete cascade;
alter table timeline_events add column if not exists planner_id uuid references planners(id) on delete cascade;
alter table notes add column if not exists planner_id uuid references planners(id) on delete cascade;
alter table daily_state add column if not exists planner_id uuid references planners(id) on delete cascade;

-- The Weekly template needs a day slot; the Minimal template is just
-- another "kind" of flat list. Both additive, both nullable/optional.
alter table tasks add column if not exists day_of_week smallint check (day_of_week between 0 and 6);
alter table tasks drop constraint if exists tasks_kind_check;
alter table tasks add constraint tasks_kind_check check (kind in ('priority', 'due_next', 'weekly', 'minimal'));

-- ---------------------------------------------------------------------
-- Backfill: give every existing user (i.e. everyone who has any rows in
-- the old single-pool tables) a default planner, then attach their
-- existing rows to it. Skipped entirely for a fresh project with no data.
-- ---------------------------------------------------------------------
do $$
declare
  u record;
  new_planner_id uuid;
begin
  for u in (
    select user_id from tasks where planner_id is null
    union
    select user_id from meetings where planner_id is null
    union
    select user_id from timeline_events where planner_id is null
    union
    select user_id from notes where planner_id is null
    union
    select user_id from daily_state where planner_id is null
  ) loop
    insert into planners (user_id, name, template_id)
    values (u.user_id, 'My Study Planner', 'dashboard')
    returning id into new_planner_id;

    update tasks set planner_id = new_planner_id where user_id = u.user_id and planner_id is null;
    update meetings set planner_id = new_planner_id where user_id = u.user_id and planner_id is null;
    update timeline_events set planner_id = new_planner_id where user_id = u.user_id and planner_id is null;
    update notes set planner_id = new_planner_id where user_id = u.user_id and planner_id is null;
    update daily_state set planner_id = new_planner_id where user_id = u.user_id and planner_id is null;
  end loop;
end $$;

-- Now that every existing row has a planner_id, require it going forward.
alter table tasks alter column planner_id set not null;
alter table meetings alter column planner_id set not null;
alter table timeline_events alter column planner_id set not null;
alter table notes alter column planner_id set not null;
alter table daily_state alter column planner_id set not null;

-- daily_state's uniqueness moves from "one row per user per day" to
-- "one row per planner per day", since trackers are now per-planner.
alter table daily_state drop constraint if exists daily_state_user_id_date_key;
alter table daily_state add constraint daily_state_planner_id_date_key unique (planner_id, date);

create index if not exists planners_user_id_idx on planners(user_id);
create index if not exists planners_folder_id_idx on planners(folder_id);
create index if not exists folders_user_id_idx on folders(user_id);
create index if not exists tasks_planner_id_idx on tasks(planner_id);
create index if not exists meetings_planner_id_idx on meetings(planner_id);
create index if not exists timeline_events_planner_id_idx on timeline_events(planner_id);
create index if not exists notes_planner_id_idx on notes(planner_id);
create index if not exists daily_state_planner_id_idx on daily_state(planner_id);
