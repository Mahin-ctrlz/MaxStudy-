-- Migration 003: Sheet-style templates (Botanical, Celestial, etc.)
-- Run after migration_002_planners_folders.sql.
--
-- Purely additive: new nullable/defaulted columns only, no backfill needed
-- since nothing existing used these fields before.

alter table tasks add column if not exists notes text;
alter table tasks add column if not exists row_index smallint check (row_index between 0 and 12);

alter table tasks drop constraint if exists tasks_kind_check;
alter table tasks add constraint tasks_kind_check
  check (kind in ('priority', 'due_next', 'weekly', 'minimal', 'sheet'));

alter table daily_state add column if not exists goal_text_2 text default '';
alter table daily_state add column if not exists owner_name text default '';

create index if not exists tasks_row_index_idx on tasks(planner_id, row_index) where kind = 'sheet';
