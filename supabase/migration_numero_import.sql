-- =============================================
-- Migration : Numéro d'import auto-incrémenté
-- À exécuter dans l'éditeur SQL de Supabase
--
-- Ajoute prospects.numero_import : un entier unique, auto-incrémenté
-- à chaque nouvel insert. Sert à pouvoir sélectionner précisément
-- un range de prospects (ex: "du 500 au 900") lors de la création
-- de campagnes, indépendamment des assignations déjà faites.
-- =============================================

-- 1. Séquence Postgres
create sequence if not exists public.prospects_numero_import_seq;

-- 2. Colonne nullable (le temps du backfill)
alter table public.prospects
  add column if not exists numero_import bigint;

-- 3. Backfill pour les prospects existants : numérotation 1, 2, 3, ...
--    dans l'ordre chronologique de leur création
with ordered as (
  select id, row_number() over (order by created_at asc) as rn
  from public.prospects
  where numero_import is null
)
update public.prospects p
set numero_import = ordered.rn
from ordered
where p.id = ordered.id;

-- 4. Aligner la séquence sur le max actuel
select setval(
  'public.prospects_numero_import_seq',
  coalesce((select max(numero_import) from public.prospects), 0) + 1,
  false
);

-- 5. Verrouiller la colonne : NOT NULL + default = nextval
alter table public.prospects
  alter column numero_import set not null,
  alter column numero_import set default nextval('public.prospects_numero_import_seq');

-- 6. Lier la séquence à la colonne (drop en cascade si la colonne est supprimée)
alter sequence public.prospects_numero_import_seq
  owned by public.prospects.numero_import;

-- 7. Index unique pour empêcher les doublons et accélérer les range queries
create unique index if not exists prospects_numero_import_idx
  on public.prospects(numero_import);
