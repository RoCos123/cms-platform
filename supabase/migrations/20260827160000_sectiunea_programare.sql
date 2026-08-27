-- ----------------------------------------------------------------------------
-- Secțiunea de programare apare singură când se pornește modulul.
--
-- PROBLEMA, găsită abia când proprietarul a vrut s-o pună pe prima pagină:
-- panoul NU are flux de „adaugă secțiune”. Secțiunile vin seedate la
-- provizionarea site-ului, iar clientul le poate doar reordona, ascunde și
-- edita — scrie chiar pe ecran: „Secțiunile se adaugă la punerea în funcțiune”.
--
-- Adică un tip NOU de secțiune, adăugat în cod după ce un site există deja,
-- n-are cum să ajungă vreodată pe acel site. Componenta era scrisă, registrul o
-- cunoștea, și tot nu se putea pune.
--
-- SOLUȚIA: rândul se creează când se bifează modulul. Un trigger, nu un pas de
-- ținut minte — aceeași judecată ca la `set_updated_at`: ce se face de mână se
-- și uită, iar aici s-ar uita exact la clientul care tocmai a plătit.
--
-- Se pune la coada paginii, pe fundal nuanțat: vine după Contact, iar treapta
-- de fundal o desparte de el în loc s-o lipească.
-- ----------------------------------------------------------------------------

create or replace function public.adauga_sectiunea_programare()
returns trigger
language plpgsql
-- `security definer` fiindcă trigger-ul scrie în `site_content` pentru un site
-- al cărui rând tocmai a fost modificat de noi, nu de client. `search_path`
-- gol, ca la celelalte funcții.
security definer
set search_path = ''
as $$
begin
  -- `not exists` și nu `on conflict`: unicitatea pe (site_id, key) a fost
  -- scoasă dinadins, ca o secțiune să poată apărea de mai multe ori pe pagină
  -- (vezi migrarea `sectiuni_repetabile`). Aici însă vrem exact una.
  if new.appointments_enabled
     and not exists (
       select 1 from public.site_content
        where site_id = new.id and key = 'programare'
     )
  then
    insert into public.site_content (site_id, key, position, tone, data, visible)
    values (
      new.id,
      'programare',
      coalesce((select max(position) from public.site_content where site_id = new.id), 0) + 10,
      'nuantat',
      '{}'::jsonb,
      true
    );
  end if;

  return new;
end;
$$;

-- Doar la UPDATE, nu și la INSERT: un site nou n-are încă nicio secțiune, deci
-- „la coada paginii” ar însemna poziția 10 — adică prima, înaintea celor
-- seedate imediat după. Un site provizionat cu modulul deja pornit primește
-- secțiunea din SQL-ul de provizionare, împreună cu celelalte.
drop trigger if exists adauga_sectiunea_programare on public.sites;
create trigger adauga_sectiunea_programare
  after update of appointments_enabled on public.sites
  for each row execute function public.adauga_sectiunea_programare();

-- ----------------------------------------------------------------------------
-- Clienții cărora modulul le e deja pornit: le-o adăugăm acum.
-- ----------------------------------------------------------------------------
insert into public.site_content (site_id, key, position, tone, data, visible)
select
  s.id,
  'programare',
  coalesce((select max(sc.position) from public.site_content sc where sc.site_id = s.id), 0) + 10,
  'nuantat',
  '{}'::jsonb,
  true
from public.sites s
where s.appointments_enabled
  and not exists (
    select 1 from public.site_content sc
     where sc.site_id = s.id and sc.key = 'programare'
  );
