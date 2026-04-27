-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create client table
create table if not exists public.client (
  id uuid primary key default gen_random_uuid(),
  designation text not null unique,
  created_at timestamptz not null default now(),
  created_by text
);

-- Add comment
comment on table public.client is 'Table pour stocker les clients';
comment on column public.client.id is 'Identifiant unique du client';
comment on column public.client.designation is 'Nom du client';
comment on column public.client.created_at is 'Date de création';
comment on column public.client.created_by is 'Créé par';

-- Insert initial data (optional)
insert into public.client (designation) values
  ('Client Exemple 1'),
  ('Client Exemple 2')
on conflict (designation) do nothing;
