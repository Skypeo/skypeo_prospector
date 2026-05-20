-- =============================================
-- Migration : Auto-passage du prospect en "repondu"
-- quand une conversation "entrant" est insérée
--
-- Contexte : le workflow n8n "whatsapp-entrant" insère bien la conversation
-- mais ne met pas à jour le statut. Ce trigger centralise la logique côté DB
-- pour que ça marche peu importe qui insère (n8n, Next.js, manuel).
--
-- À exécuter dans l'éditeur SQL Supabase
-- =============================================

create or replace function public.mark_prospect_as_repondu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.direction = 'entrant' then
    update public.prospects
    set statut = 'repondu'
    where id = new.prospect_id
      and statut = 'envoye';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mark_prospect_as_repondu on public.conversations;

create trigger trg_mark_prospect_as_repondu
  after insert on public.conversations
  for each row
  execute function public.mark_prospect_as_repondu();

-- =============================================
-- Rattrapage one-shot : les prospects qui ont répondu mais sont restés en "envoye"
--
-- Silencieux : on set notif_chaud_envoyee=true pour que le workflow n8n
-- "Notif Tim" ne spamme pas Tim avec des notifs sur des réponses anciennes.
-- On set aussi temperature='chaud' directement pour court-circuiter le trigger
-- trg_update_temperature (dont la condition NEW.temperature = OLD.temperature
-- sera fausse, donc il ne fire pas).
-- =============================================

update public.prospects
set
  statut = 'repondu',
  temperature = 'chaud',
  notif_chaud_envoyee = true
where statut = 'envoye'
  and id in (
    select distinct prospect_id
    from public.conversations
    where direction = 'entrant'
  );
