-- Enable pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create regul_capital table
create table if not exists public.regul_capital (
  id uuid not null default gen_random_uuid(),
  n_dossier text not null,
  client text not null,
  date_obtention_manifeste date null,
  delai_manifeste integer null,
  texo_date_soumission date null,
  texo_date_validation date null,
  texo_delai_validation integer null,
  texo_ref_numero text null,
  dexo_date_soumission date null,
  dexo_date_validation date null,
  dexo_delai_validation integer null,
  dexo_ref_numero text null,
  im4_date_declaration date null,
  im4_number text null,
  im4_date_bulletin date null,
  im4_bulletin_numero text null,
  im4_date_paiement date null,
  im4_date_quittance date null,
  im4_quittance_numero text null,
  im4_date_bae date null,
  im4_bae_number text null,
  delai_dedouanement_dexo integer null,
  delai_dedouanement_drd integer null,
  created_at timestamp with time zone not null default now(),
  created_by uuid null,
  constraint regul_capital_pkey primary key (id),
  constraint regul_capital_n_dossier_key unique (n_dossier)
) TABLESPACE pg_default;

-- Add comment
comment on table public.regul_capital is 'Table pour stocker les dossiers de régularisation capital';
comment on column public.regul_capital.id is 'Identifiant unique du dossier';
comment on column public.regul_capital.n_dossier is 'Numéro de dossier';
comment on column public.regul_capital.client is 'Client';
comment on column public.regul_capital.date_obtention_manifeste is 'Date d\'obtention du manifeste';
comment on column public.regul_capital.delai_manifeste is 'Délai du manifeste (en jours)';
comment on column public.regul_capital.texo_date_soumission is 'TEXO Date de soumission';
comment on column public.regul_capital.texo_date_validation is 'TEXO Date de validation';
comment on column public.regul_capital.texo_delai_validation is 'TEXO Délai de validation (en jours)';
comment on column public.regul_capital.texo_ref_numero is 'TEXO Référence numéro';
comment on column public.regul_capital.dexo_date_soumission is 'DEXO Date de soumission';
comment on column public.regul_capital.dexo_date_validation is 'DEXO Date de validation';
comment on column public.regul_capital.dexo_delai_validation is 'DEXO Délai de validation (en jours)';
comment on column public.regul_capital.dexo_ref_numero is 'DEXO Référence numéro';
comment on column public.regul_capital.im4_date_declaration is 'IM4 Date de déclaration';
comment on column public.regul_capital.im4_number is 'IM4 Number';
comment on column public.regul_capital.im4_date_bulletin is 'IM4 Date du bulletin';
comment on column public.regul_capital.im4_bulletin_numero is 'IM4 Bulletin numéro';
comment on column public.regul_capital.im4_date_paiement is 'IM4 Date de paiement';
comment on column public.regul_capital.im4_date_quittance is 'IM4 Date de quittance';
comment on column public.regul_capital.im4_quittance_numero is 'IM4 Quittance numéro';
comment on column public.regul_capital.im4_date_bae is 'IM4 Date BAE';
comment on column public.regul_capital.im4_bae_number is 'IM4 BAE Number';
comment on column public.regul_capital.delai_dedouanement_dexo is 'Délai de dédouanement DEXO (en jours)';
comment on column public.regul_capital.delai_dedouanement_drd is 'Délai de dédouanement DRD (en jours)';
comment on column public.regul_capital.created_at is 'Date de création';
comment on column public.regul_capital.created_by is 'Créé par (UUID de l\'utilisateur)';
