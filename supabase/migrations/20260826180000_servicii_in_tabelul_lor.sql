-- ============================================================================
-- Serviciile se mută din conținutul secțiunii în tabelul `services`.
--
-- PROBLEMA: „Serviciile mele" își ținea propria listă de servicii, în JSON-ul
-- secțiunii. Dar fiecare serviciu are nevoie și de o descriere lungă, pe pagina
-- de servicii. Cu două locuri de scris, clientul ar fi schimbat prețul într-unul
-- și l-ar fi uitat în celălalt — site-ul s-ar fi contrazis singur.
--
-- SOLUȚIA: un singur loc. Tabelul `services` exista din prima migrare, cu tot ce
-- trebuie (slug, descriere scurtă, descriere lungă, preț, durată). Secțiunea de
-- pe prima pagină devine vitrină și citește de acolo, exact cum „Articole
-- recente" citește din blog.
--
-- Migrarea e idempotentă: rulată de două ori, nu dublează nimic (`services` are
-- `unique (site_id, slug)`, iar a doua oară secțiunile n-au deja cheia
-- `servicii`).
-- ============================================================================

insert into public.services (site_id, slug, title, excerpt, content, position, status)
select
  sc.site_id,
  -- Adresa scurtă, din titlu: fără diacritice, fără spații, doar litere mici,
  -- cifre și cratime. Postgres n-are `unaccent` activat implicit, deci
  -- diacriticele românești se traduc explicit.
  regexp_replace(
    regexp_replace(
      lower(translate(serviciu->>'titlu', 'ăâîșțĂÂÎȘȚşţŞŢ', 'aaistAAISTstST')),
      '[^a-z0-9]+', '-', 'g'
    ),
    '(^-+|-+$)', '', 'g'
  ) as slug,
  serviciu->>'titlu',
  coalesce(serviciu->>'descriere', ''),
  -- Descrierea lungă începe de la cea scurtă: clientul o dezvoltă, nu o scrie
  -- de la zero pe pagină goală.
  coalesce(serviciu->>'descriere', ''),
  ordinalitate * 10,
  'published'
from public.site_content sc
cross join lateral jsonb_array_elements(sc.data->'servicii')
  with ordinality as t(serviciu, ordinalitate)
where sc.key = 'features'
  and jsonb_typeof(sc.data->'servicii') = 'array'
  and coalesce(serviciu->>'titlu', '') <> ''
on conflict (site_id, slug) do nothing;

-- Secțiunea rămâne cu titlul, eticheta și introducerea; lista pleacă.
update public.site_content
set data = data - 'servicii'
where key = 'features'
  and data ? 'servicii';

-- Verificare: câte servicii are fiecare site și ce a mai rămas în secțiune.
select
  s.domain,
  (select count(*) from public.services x where x.site_id = s.id) as servicii_in_tabel,
  (select count(*) from public.site_content c
     where c.site_id = s.id and c.key = 'features' and c.data ? 'servicii') as sectiuni_cu_lista_veche
from public.sites s
order by s.domain;
