-- ============================================================
-- SUPABASE SETUP — à exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table des profils utilisateurs (schéma public, pas auth)
create table if not exists public.users (
  id           text primary key,
  name         text,
  email        text unique,
  password     text,
  role         text default 'Collaborator',
  department   text default '',
  team         text default '',
  "joinDate"   text,
  color        text default '#00A8CC',
  "collabId"   text,
  "tlId"       text,
  "subprojectId" text
);

-- 2. Table des tokens d'invitation
create table if not exists public.invitation_tokens (
  id           bigint generated always as identity primary key,
  token        text unique not null,
  email        text not null,
  "subprojectId" text,
  "tlId"       text,
  "createdAt"  text,
  "acceptedAt" text
);

-- 3. Table de données applicatives du TL
create table if not exists public.tl_app_data (
  tl_id        text primary key,
  data         jsonb not null default '{}'::jsonb,
  updated_at   timestamp with time zone default now()
);

-- 4. Désactiver RLS pour simplifier (dev)
alter table public.users disable row level security;
alter table public.invitation_tokens disable row level security;
alter table public.tl_app_data disable row level security;

-- 5. Donner accès à anon et service_role
grant all on public.users to anon, service_role;
grant all on public.invitation_tokens to anon, service_role;
grant all on public.tl_app_data to anon, service_role;
grant usage on all sequences in schema public to anon, service_role;
