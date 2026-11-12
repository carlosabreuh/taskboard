-- Taskboard schema
-- Run this once in the Supabase SQL editor (Database → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- ---------- Projects ----------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  description text,
  color       text not null default '#7c6f64',
  status      text not null default 'active' check (status in ('active', 'on_hold', 'done', 'archived')),
  due_date    date,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Tasks ----------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 300),
  notes       text,
  status      text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority    text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date    date,
  position    bigint not null default 0,
  completed_at timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_project_idx on public.tasks (user_id, project_id);
create index if not exists tasks_user_due_idx     on public.tasks (user_id, due_date) where status <> 'done';
create index if not exists projects_user_idx      on public.projects (user_id);
create index if not exists tasks_user_deleted_idx    on public.tasks (user_id, deleted_at) where deleted_at is not null;
create index if not exists projects_user_deleted_idx on public.projects (user_id, deleted_at) where deleted_at is not null;

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- Each signed-in user only ever sees and edits their own rows.
alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

drop policy if exists "projects: own rows" on public.projects;
create policy "projects: own rows" on public.projects
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks: own rows" on public.tasks;
create policy "tasks: own rows" on public.tasks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
