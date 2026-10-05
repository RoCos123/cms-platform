-- ----------------------------------------------------------------------------
-- Ordinea articolelor de blog: o poziție pe articol, ca la servicii.
--
-- DE CE ACUM. Până azi blogul se aranja singur, după data publicării (cel mai
-- nou primul). Proprietarul a cerut (5 oct. 2026) ca fiecare articol să poată fi
-- mutat mai sus sau mai jos din panou, printr-un meniu „⋯" — deci ordinea nu
-- mai poate ieși din dată, ci trebuie păstrată undeva. Locul ei e o coloană,
-- exact cum o are `services.position`.
--
-- ORDINE: crescător — poziția cea mai mică apare prima, pe site și în panou.
-- La egalitate (rândurile seedate, de pildă, au toate 0) se cade pe regula
-- veche: data publicării, cele mai noi întâi, apoi data creării. Ca să nu se
-- schimbe nimic pentru cine nu mută niciun articol, rândurile existente primesc
-- mai jos EXACT ordinea de până acum, în pași de 10 (loc între ele, ca un
-- articol să poată fi băgat la mijloc fără să rescrii restul).
--
-- Articolele noi se pun, din cod, înaintea tuturor (poziția minimă − 10), deci
-- „cel mai nou primul" rămâne purtarea implicită; de aceea `default 0` e doar o
-- plasă pentru inserările care nu o dau (seed, import).
-- ----------------------------------------------------------------------------
alter table public.blog_articles
  add column position integer not null default 0;

-- Ordinea de până acum, pe fiecare site: publicate după dată (cele fără dată la
-- coadă), apoi după data creării. Ciornele n-au `published_at`, deci cad după
-- cele publicate — același loc ca în lista publică, unde nici nu apar.
update public.blog_articles a
set position = r.pozitie
from (
  select id,
         row_number() over (
           partition by site_id
           order by published_at desc nulls last, created_at desc, id
         ) * 10 as pozitie
  from public.blog_articles
) r
where a.id = r.id;
