-- Migration 004: Calendar dates + PDF export log
-- Run after migration_003_sheet_templates.sql.
--
-- Additive only. event_date defaults to today so anything already in these
-- tables (created before this migration existed) reads as "today" rather
-- than becoming undated — matches the behavior those rows already had
-- (they only ever meant "today" anyway, since there was no date concept).

alter table meetings add column if not exists event_date date not null default current_date;
alter table timeline_events add column if not exists event_date date not null default current_date;

create index if not exists meetings_event_date_idx on meetings(planner_id, event_date);
create index if not exists timeline_events_event_date_idx on timeline_events(planner_id, event_date);

-- Log of PDF exports, for the Files page. Not a general file store — this
-- app doesn't have upload/storage yet, so Files shows what it actually has:
-- a record of planners you've exported, when, and a re-download link.
create table if not exists pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  planner_id uuid not null references planners(id) on delete cascade,
  planner_name text not null,
  exported_at timestamptz not null default now()
);

alter table pdf_exports enable row level security;

create policy "Users can view their own pdf exports"
  on pdf_exports for select using (auth.uid() = user_id);
create policy "Users can insert their own pdf exports"
  on pdf_exports for insert with check (auth.uid() = user_id);
create policy "Users can delete their own pdf exports"
  on pdf_exports for delete using (auth.uid() = user_id);

create index if not exists pdf_exports_user_id_idx on pdf_exports(user_id);
