-- =============================================
-- Migration : Ajout colonne température (lead scoring)
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Ajouter la colonne temperature avec valeur par défaut "froid"
alter table public.prospects
  add column if not exists temperature text not null default 'froid'
    check (temperature in ('froid', 'tiede', 'chaud', 'brulant'));

-- Index pour filtrer par température
create index if not exists prospects_temperature_idx on public.prospects(temperature);
