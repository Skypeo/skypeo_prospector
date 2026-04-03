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

-- =============================================
-- Trigger : mise à jour auto de la température
-- quand le statut change
-- =============================================

create or replace function public.update_temperature_on_statut()
returns trigger as $$
begin
  if NEW.statut is distinct from OLD.statut then
    NEW.temperature := case NEW.statut
      when 'en_attente' then 'froid'
      when 'envoye'     then 'tiede'
      when 'repondu'    then 'chaud'
      when 'rdv'        then 'brulant'
      when 'refus'      then 'froid'
      else 'froid'
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_update_temperature on public.prospects;

create trigger trg_update_temperature
  before update on public.prospects
  for each row
  when (OLD.statut is distinct from NEW.statut and NEW.temperature = OLD.temperature)
  execute function public.update_temperature_on_statut();

-- Mettre à jour les prospects existants selon leur statut actuel
update public.prospects set temperature = case statut
  when 'en_attente' then 'froid'
  when 'envoye'     then 'tiede'
  when 'repondu'    then 'chaud'
  when 'rdv'        then 'brulant'
  when 'refus'      then 'froid'
  else 'froid'
end;
