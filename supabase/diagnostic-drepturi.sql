-- ============================================================================
-- De ce n-a prins revocarea? Trei întrebări, un singur tabel de răspunsuri.
--
-- 9 sept. 2026. Migrarea `20260909100000_drepturi_de_executie.sql` a rulat, iar
-- drepturile au rămas neschimbate: `anon=X authenticated=X service_role=X`.
--
-- În PostgreSQL, `REVOKE` scoate DOAR granturile date de rolul care revocă. Un
-- grant dat de altcineva nu se atinge, iar comanda NU dă eroare — dă o
-- avertizare („no privileges could be revoked") și se încheie cu succes. Adică
-- exact felul de eșec care arată ca o reușită.
--
-- Amprenta n-a putut arăta asta, fiindcă taie partea de după `/` din fiecare
-- drept — adică tocmai cine l-a dat.
--
-- CUM SE RULEAZĂ: SQL Editor → New query → tot fișierul → Run. Fără text
-- selectat. NU MODIFICĂ NIMIC, sunt numai citiri.
-- ============================================================================

with functiile as (
  select p.oid, p.proname, p.proacl, pg_get_userbyid(p.proowner) as proprietar
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)

-- 1. Cine rulează interogarea. Dacă nu e proprietarul funcțiilor, revocarea
--    n-avea cum să scoată granturi date de el.
select 1 as nr, 'cine rulează' as intrebare,
  format('current_user=%s, session_user=%s', current_user, session_user) as raspuns

union all

-- 2. Drepturile BRUTE, cu tot cu acordant — partea tăiată din amprentă.
--    Se citește `beneficiar=drepturi/acordant`.
select 2, format('drepturi brute pe %s (proprietar: %s)', f.proname, f.proprietar),
  coalesce(array_to_string(f.proacl, '   '), '(niciunul — implicit, oricine)')
from functiile f
where f.proname in ('creeaza_client', 'inregistreaza_afisarea', 'current_site_id')

union all

-- 3. Declarația de drepturi implicite a proiectului: de ea atârnă dacă FIECARE
--    funcție viitoare se naște deschisă, sau dacă a fost ceva de o singură dată.
select 3, format('drepturi implicite, puse de %s pentru %s', d.defaclrole::regrole,
    coalesce(nullif(d.defaclnamespace, 0)::regnamespace::text, '(toate schemele)')),
  format('%s: %s',
    case d.defaclobjtype when 'r' then 'tabele' when 'f' then 'funcții'
      when 'S' then 'secvențe' when 'T' then 'tipuri' else d.defaclobjtype::text end,
    array_to_string(d.defaclacl, '   '))
from pg_default_acl d

union all

-- 4. Cuprinsul funcției care diferă, ca să pot compara cu migrarea.
select 4, 'cuprinsul lui adauga_sectiunea_programare', p.prosrc
from functiile f, pg_proc p
where f.oid = p.oid and f.proname = 'adauga_sectiunea_programare'

order by nr, intrebare;
