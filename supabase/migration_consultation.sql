-- =============================================
-- Migration : Suivi des consultations prospects
--
-- Permet d'afficher un badge "Nouveau" sur les prospects ayant
-- une réponse jamais consultée par l'utilisateur (au lieu d'une
-- fenêtre temporelle fixe). Le badge disparaît dès qu'on ouvre
-- la fiche prospect, et réapparaît si le prospect réécrit après.
--
-- À exécuter dans l'éditeur SQL Supabase
-- =============================================

alter table public.prospects
  add column if not exists derniere_consultation_at timestamptz;

create index if not exists prospects_derniere_consultation_idx
  on public.prospects(derniere_consultation_at);
