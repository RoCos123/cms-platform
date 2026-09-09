-- ============================================================================
-- Repară cele trei diferențe rămase, ȘI SPUNE dacă a reușit.
--
-- 9 sept. 2026. Migrarea de revocare a rulat o dată și drepturile n-au mișcat,
-- iar diagnosticul a arătat că acordantul lor E `postgres` — adică chiar rolul
-- care rulează SQL Editor-ul. Deci revocarea ar fi trebuit să prindă, și n-a
-- prins. Fișierul ăsta revocă din nou și se uită IMEDIAT, în aceeași rulare, ca
-- răspunsul să nu mai atârne de nimic din afară.
--
-- Repară și cuprinsul lui `adauga_sectiunea_programare`, care în bază e identic
-- cu migrarea mai puțin comentariile — semn că ce s-a rulat pe 27 aug. a fost o
-- copie din discuție, nu fișierul. Blocul de mai jos e SCOS chiar din migrare,
-- de un script, ca să nu mai poată să difere.
--
-- CUM SE RULEAZĂ: SQL Editor → New query → tot fișierul → Run, FĂRĂ text
-- selectat. La sfârșit scrie un tabel cu trei rânduri și verdictul fiecăruia.
--
-- Ce schimbă: drepturile de execuție a două funcții și cuprinsul uneia. Nicio
-- dată a niciunui client nu e atinsă.
-- ============================================================================

-- 1. Cuprinsul funcției, scos din migrarea care o definește.
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

-- 2. Drepturile. `create or replace` de mai sus PĂSTREAZĂ drepturile, deci
--    ordinea nu strică nimic; revocarea vine totuși după, ca starea de la
--    urmă să fie cea închisă.
revoke execute on function public.creeaza_client(text, text, text, text, boolean)
  from anon, authenticated;

revoke execute on function public.inregistreaza_afisarea(uuid, date, text)
  from anon, authenticated;

-- 3. A prins? Se citește ACUM, în aceeași sesiune.
with f as (
  select p.proname, p.proacl,
    left(md5(regexp_replace(btrim(p.prosrc), '\s+', ' ', 'g')), 12) as cuprins
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select 'creeaza_client' as lucrul,
  case when array_to_string(f.proacl, ' ') ~ '(^|[ ])(anon|authenticated)='
    then 'ÎNCĂ DESCHISĂ — revocarea n-a prins nici acum'
    else 'închisă' end as verdict,
  array_to_string(f.proacl, '   ') as cum_arata
from f where f.proname = 'creeaza_client'

union all

select 'inregistreaza_afisarea',
  case when array_to_string(f.proacl, ' ') ~ '(^|[ ])(anon|authenticated)='
    then 'ÎNCĂ DESCHISĂ — revocarea n-a prins nici acum'
    else 'închisă' end,
  array_to_string(f.proacl, '   ')
from f where f.proname = 'inregistreaza_afisarea'

union all

select 'cuprinsul lui adauga_sectiunea_programare',
  case when f.cuprins = '934ddbb41d43' then 'la fel ca migrarea'
    else 'ÎNCĂ ALTUL' end,
  'cuprins ' || f.cuprins
from f where f.proname = 'adauga_sectiunea_programare'

order by lucrul;
