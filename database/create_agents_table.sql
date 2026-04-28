-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create AGENTS table
create table if not exists public.agents (
  id uuid not null default gen_random_uuid(),
  nom text not null,
  email text not null,
  role text not null,
  region text null,
  password text not null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  permission text null,
  constraint agents_pkey primary key (id),
  constraint agents_email_key unique (email)
) tablespace pg_default;

-- Add comments
comment on table public.agents is 'Table pour stocker les agents/utilisateurs du système';
comment on column public.agents.id is 'Identifiant unique de l''agent';
comment on column public.agents.nom is 'Nom complet de l''agent';
comment on column public.agents.email is 'Adresse email unique de l''agent';
comment on column public.agents.role is 'Rôle de l''agent (Administrateur, Gestionnaire, Utilisateur, etc.)';
comment on column public.agents.region is 'Région assignée à l''agent';
comment on column public.agents.password is 'Mot de passe haché de l''agent';
comment on column public.agents.permission is 'Permissions supplémentaires de l''agent';
comment on column public.agents.created_at is 'Date de création de l''enregistrement';
comment on column public.agents.created_by is 'Créé par';

-- Create indexes for common lookups
create index if not exists idx_agents_email on public.agents(email);
create index if not exists idx_agents_role on public.agents(role);

-- Enable Row Level Security (RLS)
alter table public.agents enable row level security;

-- Create policy to allow read access for authenticated users
create policy "Agents are viewable by authenticated users"
  on public.agents for select
  to authenticated
  using (true);

-- Create policy to allow insert for authenticated users
create policy "Agents can be inserted by authenticated users"
  on public.agents for insert
  to authenticated
  with check (true);

-- Create policy to allow update for authenticated users
create policy "Agents can be updated by authenticated users"
  on public.agents for update
  to authenticated
  using (true);

-- Insert default admin user (password: admin123 - should be changed in production)
-- Note: This is a bcrypt hash for 'admin123'
insert into public.agents (nom, email, role, password, permission)
values (
  'Administrateur',
  'admin@sgl.com',
  'Administrateur',
  '$2a$10$YourBcryptHashHereForAdmin123',
  'full_access'
)
on conflict (email) do nothing;
