-- Supprimer les anciennes tables si elles existent
drop table if exists public.users;
drop table if exists public.invitation_tokens;
drop table if exists public.tl_app_data;

-- 1. Table users (colonnes en snake_case)
create table public.users (
  id             text primary key,
  name           text,
  email          text unique,
  password       text,
  role           text default 'TL',
  department     text default '',
  team           text default '',
  join_date      text,
  color          text default '#00A8CC',
  collab_id      text,
  tl_id          text,
  subproject_id  text
);

-- 2. Table invitation_tokens
create table public.invitation_tokens (
  id            bigint generated always as identity primary key,
  token         text unique not null,
  email         text not null,
  subproject_id text,
  tl_id         text,
  created_at    text,
  accepted_at   text
);

-- 3. Table tl_app_data
create table public.tl_app_data (
  tl_id      text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 4. Désactiver RLS
alter table public.users disable row level security;
alter table public.invitation_tokens disable row level security;
alter table public.tl_app_data disable row level security;

-- 5. Permissions
grant all on public.users to anon, service_role;
grant all on public.invitation_tokens to anon, service_role;
grant all on public.tl_app_data to anon, service_role;
grant usage on all sequences in schema public to anon, service_role;
