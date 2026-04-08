-- =============================================
-- Skypeo Prospector — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Table prospects
create table if not exists public.prospects (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  societe text,
  telephone text not null,
  activite text,
  ville text,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'envoye', 'repondu', 'rdv', 'refus')),
  created_at timestamptz default now() not null
);

-- Table conversations
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  message text not null,
  direction text not null check (direction in ('entrant', 'sortant')),
  timestamp timestamptz default now() not null
);

-- Table campagnes
create table if not exists public.campagnes (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  nb_envois_par_jour integer not null default 20,
  statut text not null default 'active'
    check (statut in ('active', 'pause', 'terminee')),
  created_at timestamptz default now() not null
);

-- =============================================
-- Row Level Security
-- =============================================

alter table public.prospects enable row level security;
alter table public.conversations enable row level security;
alter table public.campagnes enable row level security;

-- Politique : seuls les utilisateurs authentifiés ont accès
create policy "Authenticated users can manage prospects"
  on public.prospects for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage conversations"
  on public.conversations for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage campagnes"
  on public.campagnes for all
  to authenticated
  using (true)
  with check (true);

-- =============================================
-- Index pour les performances
-- =============================================

create index if not exists prospects_statut_idx on public.prospects(statut);
create index if not exists conversations_prospect_id_idx on public.conversations(prospect_id);
create index if not exists conversations_timestamp_idx on public.conversations(timestamp);
create index if not exists prospects_campagne_id_idx on public.prospects(campagne_id);

-- =============================================
-- Migration : lier prospects aux campagnes
-- À exécuter dans l'éditeur SQL Supabase
-- =============================================

alter table public.prospects
  add column if not exists campagne_id uuid references public.campagnes(id) on delete set null;

-- =============================================
-- Migration : température prospect (lead scoring)
-- =============================================

alter table public.prospects
  add column if not exists temperature text not null default 'froid'
    check (temperature in ('froid', 'tiede', 'chaud', 'brulant'));

create index if not exists prospects_temperature_idx on public.prospects(temperature);

-- =============================================
-- Table settings (prompt agent IA)
-- =============================================

create table if not exists public.settings (
  id integer primary key default 1,
  prompt text not null default '',
  tim_whatsapp text not null default '',
  updated_at timestamptz default now() not null,
  constraint single_row check (id = 1)
);

-- Flags anti-spam pour les notifs WhatsApp Tim
alter table public.prospects
  add column if not exists notif_chaud_envoyee boolean not null default false,
  add column if not exists notif_brulant_envoyee boolean not null default false;

-- =============================================
-- Migration : Numéro d'import auto-incrémenté
-- (sélection par range dans la création de campagnes)
-- =============================================

create sequence if not exists public.prospects_numero_import_seq;

alter table public.prospects
  add column if not exists numero_import bigint;

with ordered as (
  select id, row_number() over (order by created_at asc) as rn
  from public.prospects
  where numero_import is null
)
update public.prospects p
set numero_import = ordered.rn
from ordered
where p.id = ordered.id;

select setval(
  'public.prospects_numero_import_seq',
  coalesce((select max(numero_import) from public.prospects), 0) + 1,
  false
);

alter table public.prospects
  alter column numero_import set not null,
  alter column numero_import set default nextval('public.prospects_numero_import_seq');

alter sequence public.prospects_numero_import_seq
  owned by public.prospects.numero_import;

create unique index if not exists prospects_numero_import_idx
  on public.prospects(numero_import);

alter table public.settings enable row level security;

create policy "Authenticated users can manage settings"
  on public.settings for all
  to authenticated
  using (true)
  with check (true);
