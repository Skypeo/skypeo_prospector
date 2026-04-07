-- =============================================
-- Migration : Notifications WhatsApp Tim
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- 1. Flags anti-spam : une notif max par niveau (chaud / brûlant) par prospect
alter table public.prospects
  add column if not exists notif_chaud_envoyee boolean not null default false,
  add column if not exists notif_brulant_envoyee boolean not null default false;

-- Marquer comme "déjà notifié" les prospects qui sont déjà chaud/brûlant
-- (sinon Tim recevrait 100 notifs d'un coup à l'activation)
update public.prospects
  set notif_chaud_envoyee = true
  where temperature in ('chaud', 'brulant');

update public.prospects
  set notif_brulant_envoyee = true
  where temperature = 'brulant';

-- 2. Ajouter la colonne tim_whatsapp à la table settings (modifiable depuis /agent)
-- Le numéro réel se configure depuis l'UI /agent après le déploiement.
alter table public.settings
  add column if not exists tim_whatsapp text not null default '';

-- S'assurer qu'il existe bien une ligne settings (id=1)
insert into public.settings (id, prompt, tim_whatsapp)
  values (1, '', '')
  on conflict (id) do nothing;
