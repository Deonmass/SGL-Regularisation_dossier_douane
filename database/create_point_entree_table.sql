-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create point_entree table
create table if not exists public.point_entree (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  ville text,
  created_at timestamptz not null default now(),
  created_by uuid,
  region text
);

-- Add comment
comment on table public.point_entree is 'Table pour stocker les points d\'entrée';
comment on column public.point_entree.id is 'Identifiant unique du point d\'entrée';
comment on column public.point_entree.designation is 'Désignation du point d\'entrée';
comment on column public.point_entree.ville is 'Ville du point d\'entrée';
comment on column public.point_entree.created_at is 'Date de création';
comment on column public.point_entree.created_by is 'Créé par (ID utilisateur)';
comment on column public.point_entree.region is 'Région associée';
