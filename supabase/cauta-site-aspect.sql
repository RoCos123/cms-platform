-- =============================================================================
-- Caută id-ul site-ului pe care se pornește meniul „Aspect" (culorile).
--
-- De ce: „Aspect" e în probă și apare doar pe site-urile din lista
-- `SITE_URI_CU_ASPECT` (src/lib/aspect/acces.ts), după `sites.id`. Proprietarul
-- l-a cerut pe site-ul Popescu Robert (pe șablonul Claritate), NU pe
-- sitepsihologi — iar id-ul lui nu e în depozit.
--
-- Doar CITEȘTE: nu schimbă nimic. Se poate rula de oricâte ori.
--
-- Rezultat: unul sau mai multe rânduri. Alege-l pe cel care e site-ul tău
-- (după `domain` și `name`) și trimite-mi id-ul. Dacă site-ul tău nu are
-- `template = claritate`, spune-mi: poarta cere ȘI șablonul Claritate.
-- =============================================================================

select id, domain, name, template, published_at is not null as publicat
from public.sites
where template = 'claritate'
   or name ilike '%popescu%'
   or name ilike '%robert%'
   or domain ilike '%claritate%'
order by domain;
