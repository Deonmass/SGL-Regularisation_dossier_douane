-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create mode_transport table
create table if not exists public.mode_transport (
  id uuid primary key default gen_random_uuid(),
  designation text not null unique,
  code text,
  created_at timestamptz not null default now(),
  created_by text
);

-- Add comment
comment on table public.mode_transport is 'Table pour stocker les modes de transport';
comment on column public.mode_transport.id is 'Identifiant unique du mode de transport';
comment on column public.mode_transport.designation is 'Désignation du mode de transport (ex: Maritime, Aérien, Routier, Ferroviaire)';
comment on column public.mode_transport.code is 'Code du mode de transport (ex: MAR, AIR, ROU, FER)';
comment on column public.mode_transport.created_at is 'Date de création';

-- Insert initial data
insert into public.mode_transport (designation, code) values
  ('Maritime', 'MAR'),
  ('Aérien', 'AIR'),
  ('Routier', 'ROU'),
  ('Ferroviaire', 'FER')
on conflict (designation) do nothing;
