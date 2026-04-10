-- ============================================================
-- SUPABASE SETUP v2 — Tables relationnelles
-- Exécuter dans Supabase → SQL Editor → New Query
-- ============================================================

-- 0. Drop old tables
drop table if exists public.meetings cascade;
drop table if exists public.collaborators cascade;
drop table if exists public.subprojects cascade;
drop table if exists public.projects cascade;
drop table if exists public.tl_app_data cascade;
drop table if exists public.invitation_tokens cascade;
drop table if exists public.users cascade;

-- 1. Users
create table public.users (
  id            text primary key,
  name          text,
  email         text unique,
  password      text,
  role          text default 'TL',
  department    text default '',
  team          text default '',
  join_date     text,
  color         text default '#00A8CC',
  collab_id     text,
  tl_id         text,
  subproject_id text
);

-- 2. Invitation tokens
create table public.invitation_tokens (
  id            bigint generated always as identity primary key,
  token         text unique not null,
  email         text not null,
  subproject_id text,
  tl_id         text,
  created_at    text,
  accepted_at   text
);

-- 3. Projects
create table public.projects (
  id         text primary key,
  tl_id      text references public.users(id) on delete cascade,
  name       text not null default '',
  code       text default '',
  color      text default '#E8531D',
  date_from  text,
  date_to    text,
  created_at timestamptz default now()
);

-- 4. Subprojects
create table public.subprojects (
  id         text primary key,
  project_id text references public.projects(id) on delete cascade,
  name       text not null default '',
  code       text default '',
  date_from  text,
  date_to    text
);

-- 5. Collaborators
create table public.collaborators (
  id               text primary key,
  tl_id            text references public.users(id) on delete cascade,
  name             text not null default '',
  initials         text,
  email            text,
  subproject_id    text,
  date_from        text,
  date_to          text,
  change_history   jsonb default '[]'::jsonb,
  invitation_token text
);

-- 6. Meetings (sections = tasks per collab, stored as JSONB)
create table public.meetings (
  id         text primary key,
  tl_id      text references public.users(id) on delete cascade,
  project_id text,
  date       text not null,
  title      text not null,
  sections   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 7. Disable RLS (dev)
alter table public.users              disable row level security;
alter table public.invitation_tokens  disable row level security;
alter table public.projects           disable row level security;
alter table public.subprojects        disable row level security;
alter table public.collaborators      disable row level security;
alter table public.meetings           disable row level security;

-- 8. Permissions
grant all on public.users             to anon, service_role;
grant all on public.invitation_tokens to anon, service_role;
grant all on public.projects          to anon, service_role;
grant all on public.subprojects       to anon, service_role;
grant all on public.collaborators     to anon, service_role;
grant all on public.meetings          to anon, service_role;
grant usage on all sequences in schema public to anon, service_role;
