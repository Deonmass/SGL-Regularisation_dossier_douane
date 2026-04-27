-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create regime_importation table
create table if not exists public.regime_importation (
  id uuid primary key default gen_random_uuid(),
  declaration text not null unique,
  type_declaration text,
  created_at timestamptz not null default now(),
  created_by text
);

-- Add comment
comment on table public.regime_importation is 'Table pour stocker les régimes d\'importation';
comment on column public.regime_importation.id is 'Identifiant unique du régime d\'importation';
comment on column public.regime_importation.declaration is 'Déclaration du régime d\'importation (ex: Mise à la Consommation, Demande Préalable 9)';
comment on column public.regime_importation.type_declaration is 'Type de déclaration (ex: IM4, DP9)';
comment on column public.regime_importation.created_at is 'Date de création';
comment on column public.regime_importation.created_by is 'Créé par';

-- Insert initial data
insert into public.regime_importation (declaration, type_declaration) values
  ('Mise à la Consommation', 'IM4'),
  ('Demande Préalable 9', 'DP9')
on conflict (declaration) do nothing;
