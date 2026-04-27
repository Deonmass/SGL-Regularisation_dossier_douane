-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create bureau_douane table
create table if not exists public.bureau_douane (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  region text,
  mode_transport text,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Add comment
comment on table public.bureau_douane is 'Table pour stocker les bureaux de douane';
comment on column public.bureau_douane.id is 'Identifiant unique du bureau de douane';
comment on column public.bureau_douane.designation is 'Désignation du bureau de douane';
comment on column public.bureau_douane.region is 'Région associée (Ouest, Est, Sud)';
comment on column public.bureau_douane.mode_transport is 'Mode de transport';
comment on column public.bureau_douane.created_at is 'Date de création';
comment on column public.bureau_douane.created_by is 'Créé par (ID utilisateur)';
