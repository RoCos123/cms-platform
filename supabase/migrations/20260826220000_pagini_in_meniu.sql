-- ----------------------------------------------------------------------------
-- Pagini: unde se leagă și în ce ordine.
--
-- Tabelul `pages` avea de la început titlu, adresă și conținut, dar nimic
-- despre CUM ajunge cineva la ele. O pagină publicată la care nu duce niciun
-- link e scrisă degeaba — aceeași problemă ca o poză încărcată și nepusă
-- nicăieri.
--
-- Trei locuri, fiindcă paginile unui cabinet nu sunt toate la fel:
--   header — ce caută vizitatorul (Tarife, Cabinetul);
--   footer — ce trebuie să existe, dar nu se caută (confidențialitate, termeni);
--   none   — pagini cu link dat direct (o campanie, un formular trimis pe email).
--
-- Implicit `footer`, nu `none`: o pagină nouă apare undeva, chiar dacă discret.
-- Cu `none` implicit, clientul ar publica-o și ar rămâne invizibilă fără să afle
-- de ce.
-- ----------------------------------------------------------------------------

alter table public.pages
  add column if not exists position integer not null default 0,
  add column if not exists nav_location text not null default 'footer';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pages_nav_location_check'
  ) then
    alter table public.pages
      add constraint pages_nav_location_check
      check (nav_location in ('header', 'footer', 'none'));
  end if;
end;
$$;

-- Citirea publică cere mereu aceleași trei coloane: site, stare, ordine.
create index if not exists pages_site_status_position_idx
  on public.pages (site_id, status, position);
