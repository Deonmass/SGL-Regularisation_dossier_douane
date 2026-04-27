-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create region table
create table if not exists public.region (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  ville text,
  created_at timestamptz not null default now(),
  created_by uuid,
  adresse text
);

-- Add comment
comment on table public.region is 'Table pour stocker les régions';
comment on column public.region.id is 'Identifiant unique de la région';
comment on column public.region.designation is 'Désignation de la région';
comment on column public.region.ville is 'Ville de la région';
comment on column public.region.created_at is 'Date de création';
comment on column public.region.created_by is 'Créé par (ID utilisateur)';
comment on column public.region.adresse is 'Adresse de la région';
