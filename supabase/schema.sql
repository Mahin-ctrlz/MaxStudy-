-- Study Planner schema
-- Run this in Supabase: Project -> SQL Editor -> New query -> paste -> Run.
--
-- Every table has a `user_id` column tied to auth.users, and Row Level
-- Security (RLS) is turned on with policies that check
-- `auth.uid() = user_id`. This is what actually prevents one user from
-- reading or writing another user's data — it's enforced by Postgres
-- itself, not by application code, so it holds even if a bug in the app
-- forgets to filter by user.

-- ---------------------------------------------------------------------
-- Tasks (used by the Priority card and Due Next card — `kind` distinguishes them)
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('priority', 'due_next')),
  name text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Meetings
-- ---------------------------------------------------------------------
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  time text not null,
  name text not null,
  cancelled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table meetings enable row level security;

create policy "Users can view their own meetings"
  on meetings for select using (auth.uid() = user_id);
create policy "Users can insert their own meetings"
  on meetings for insert with check (auth.uid() = user_id);
create policy "Users can update their own meetings"
  on meetings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own meetings"
  on meetings for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Timeline events
-- ---------------------------------------------------------------------
create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  start_hour numeric not null,
  duration numeric not null,
  color text not null default 'purple' check (color in ('purple', 'green')),
  created_at timestamptz not null default now()
);

alter table timeline_events enable row level security;

create policy "Users can view their own timeline events"
  on timeline_events for select using (auth.uid() = user_id);
create policy "Users can insert their own timeline events"
  on timeline_events for insert with check (auth.uid() = user_id);
create policy "Users can update their own timeline events"
  on timeline_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own timeline events"
  on timeline_events for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Notes (freeform, plain text paragraphs)
-- ---------------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "Users can view their own notes"
  on notes for select using (auth.uid() = user_id);
create policy "Users can insert their own notes"
  on notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes"
  on notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notes"
  on notes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Daily state: one row per user per day for the goal text, quote,
-- water/break tracker counts, and mood — small enough to keep flat
-- instead of splitting into four more tables.
-- ---------------------------------------------------------------------
create table if not exists daily_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  goal_text text default '',
  quote_text text default '',
  water_filled integer not null default 0 check (water_filled between 0 and 5),
  break_filled integer not null default 0 check (break_filled between 0 and 5),
  mood text check (mood in ('happy', 'neutral', 'sad')),
  unique (user_id, date)
);

alter table daily_state enable row level security;

create policy "Users can view their own daily state"
  on daily_state for select using (auth.uid() = user_id);
create policy "Users can insert their own daily state"
  on daily_state for insert with check (auth.uid() = user_id);
create policy "Users can update their own daily state"
  on daily_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own daily state"
  on daily_state for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Indexes — every table is always filtered by user_id, so this is the
-- one index that matters for query speed as data grows.
-- ---------------------------------------------------------------------
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists meetings_user_id_idx on meetings(user_id);
create index if not exists timeline_events_user_id_idx on timeline_events(user_id);
create index if not exists notes_user_id_idx on notes(user_id);
create index if not exists daily_state_user_id_idx on daily_state(user_id);
