-- ============================================================
-- SUPABASE SETUP — à exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table des utilisateurs (profils)
create table if not exists public.users (
  id           text primary key,
  name         text,
  email        text unique,
  password     text,
  role         text default 'Collaborator',
  department   text,
  team         text,
  "joinDate"   text,
  color        text,
  "collabId"   text,
  "tlId"       text,        -- ID du TL qui a invité ce collaborateur
  "subprojectId" text       -- Sous-projet assigné lors de l'invitation
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

-- 3. Table de données applicatives du TL (partagée avec ses collaborateurs)
create table if not exists public.tl_app_data (
  tl_id        text primary key,
  data         jsonb not null default '{}'::jsonb,
  updated_at   timestamp with time zone default now()
);

-- 4. Politiques RLS (Row Level Security) — désactiver pour simplifier en dev
alter table public.users disable row level security;
alter table public.invitation_tokens disable row level security;
alter table public.tl_app_data disable row level security;

-- ============================================================
-- NOTE : En production, activer RLS et ajouter des policies
-- pour que chaque utilisateur ne voie que ses propres données.
-- ============================================================
