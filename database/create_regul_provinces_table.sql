-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create regul_provinces table
create table if not exists public.regul_provinces (
  id uuid not null default gen_random_uuid(),
  n_dossier text not null,
  client text not null,
  date_saisie_ie_ic date null,
  date_soumission_ie_ic_client date null,
  date_validation_ie_ic_client date null,
  date_soumission_ie_ic_drf date null,
  date_validation_ie_ic_drf date null,
  numero_validation text null,
  date_retrait_ie_ic_drf date null,
  date_envoi_province date null,
  date_reception_ie_ic_province date null,
  date_depot_da date null,
  date_validation_da date null,
  date_retrait date null,
  date_soumission_im4 date null,
  numero_im4 text null,
  date_bulletin date null,
  numero_bulletin text null,
  date_quittance date null,
  montant_bulletin numeric(20, 2) null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint regul_provinces_pkey primary key (id),
  constraint regul_provinces_n_dossier_key unique (n_dossier)
) TABLESPACE pg_default;

-- Add comment
comment on table public.regul_provinces is 'Table pour stocker les dossiers de régularisation provinces';
comment on column public.regul_provinces.id is 'Identifiant unique du dossier';
comment on column public.regul_provinces.n_dossier is 'Numéro de dossier';
comment on column public.regul_provinces.client is 'Client';
comment on column public.regul_provinces.date_saisie_ie_ic is 'Date de saisie IE/IC';
comment on column public.regul_provinces.date_soumission_ie_ic_client is 'Date de soumission IE/IC client';
comment on column public.regul_provinces.date_validation_ie_ic_client is 'Date de validation IE/IC client';
comment on column public.regul_provinces.date_soumission_ie_ic_drf is 'Date de soumission IE/IC DRF';
comment on column public.regul_provinces.date_validation_ie_ic_drf is 'Date de validation IE/IC DRF';
comment on column public.regul_provinces.numero_validation is 'Numéro de validation';
comment on column public.regul_provinces.date_retrait_ie_ic_drf is 'Date de retrait IE/IC DRF';
comment on column public.regul_provinces.date_envoi_province is 'Date d\'envoi province';
comment on column public.regul_provinces.date_reception_ie_ic_province is 'Date de réception IE/IC province';
comment on column public.regul_provinces.date_depot_da is 'Date de dépôt DA';
comment on column public.regul_provinces.date_validation_da is 'Date de validation DA';
comment on column public.regul_provinces.date_retrait is 'Date de retrait';
comment on column public.regul_provinces.date_soumission_im4 is 'Date de soumission IM4';
comment on column public.regul_provinces.numero_im4 is 'Numéro IM4';
comment on column public.regul_provinces.date_bulletin is 'Date du bulletin';
comment on column public.regul_provinces.numero_bulletin is 'Numéro du bulletin';
comment on column public.regul_provinces.date_quittance is 'Date de quittance';
comment on column public.regul_provinces.montant_bulletin is 'Montant du bulletin';
comment on column public.regul_provinces.created_at is 'Date de création';
comment on column public.regul_provinces.created_by is 'Créé par (UUID de l\'utilisateur)';
