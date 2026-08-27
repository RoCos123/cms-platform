-- ----------------------------------------------------------------------------
-- Vizite: câte afișări are fiecare pagină, pe zile.
--
-- De ce numărăm noi și nu punem Google Analytics: la sute de clienți, GA ar
-- însemna câte o proprietate și un ID de măsurare per cabinet, adică sute de
-- configurări manuale. Aici nu e nimic de configurat — paginile se randează
-- deja pe server la fiecare cerere, iar `site_id` e știut din tenant. Un client
-- nou are statistici din prima zi, fără ca cineva să atingă ceva.
--
-- Ce NU numărăm, deliberat: vizitatori unici. Ar cere o amprentă din IP și
-- browser, adică exact urmărirea pe care șablonul de politică de
-- confidențialitate o exclude în numele clientului („nu pun niciun cookie",
-- „nu folosesc niciun program de urmărire"). Afișările pe pagină răspund
-- oricum la întrebarea pentru care se uită omul aici: se citește ce scriu?
--
-- Rândurile sunt mărginite prin construcție: un rând per client, zi și pagină.
-- Un cabinet cu douăzeci de pagini face ~7.300 de rânduri pe an. Nu e nevoie
-- de curățenie periodică, deci nu există nici mecanism de curățenie care să se
-- strice în tăcere.
-- ----------------------------------------------------------------------------

create table if not exists public.page_views_daily (
  site_id uuid not null references public.sites (id) on delete cascade,
  -- Ziua se calculează în aplicație, pe fusul României — vezi src/lib/vizite.ts.
  -- Serverul rulează pe UTC, iar `current_date` de aici ar rupe ziua la 3
  -- dimineața vara, adică ar muta afișările de seară pe ziua următoare.
  day date not null,
  path text not null,
  views integer not null default 0,
  primary key (site_id, day, path)
);

alter table public.page_views_daily enable row level security;

-- ----------------------------------------------------------------------------
-- Citire: doar proprietarul propriului site. Scrierea nu are politică
-- deliberat — se face server-side, cu cheia secretă, din randarea paginii
-- publice. Un vizitator n-are cum să-și umfle singur cifrele.
-- ----------------------------------------------------------------------------
create policy "page_views_daily: proprietarul își vede propriile cifre"
  on public.page_views_daily for select
  to authenticated
  using (site_id = public.current_site_id());

-- ----------------------------------------------------------------------------
-- O afișare în plus.
--
-- Funcție, nu un upsert scris în aplicație, din două motive: e o singură
-- călătorie până la bază pe fiecare pagină servită, iar incrementul se face
-- atomic în bază — două cereri simultane pe aceeași pagină nu se pot suprascrie
-- una pe alta, cum s-ar întâmpla cu „citește, adună unu, scrie".
-- ----------------------------------------------------------------------------
create or replace function public.inregistreaza_afisarea(
  p_site_id uuid,
  p_zi date,
  p_cale text
)
returns void
language sql
-- `security definer` fiindcă tabelul n-are politică de scriere pentru nimeni.
-- `search_path` gol: aceeași regulă ca la `current_site_id()` — funcția nu are
-- voie să poată fi păcălită cu un tabel pus într-o schemă din calea de căutare.
security definer
set search_path = ''
as $$
  insert into public.page_views_daily as v (site_id, day, path, views)
  values (p_site_id, p_zi, p_cale, 1)
  on conflict (site_id, day, path) do update set views = v.views + 1;
$$;

-- Rolurile din browser n-au ce căuta aici: dacă ar putea chema funcția, oricine
-- deschide site-ul și-ar putea scrie singur ce cifre vrea în panoul clientului
-- — sau, dându-i alt `site_id`, în panoul altui client.
--
-- `from public` e linia care contează, și e ușor de scris greșit: Postgres dă
-- din start drept de execuție lui PUBLIC pe orice funcție nouă, iar `anon` și
-- `authenticated` îl moștenesc de acolo. Un `revoke ... from anon` în plus
-- n-ar face nimic — l-am scris, l-am probat, și nu schimba nimic.
--
-- Probat pe bancul local în ambele feluri: și cu linia asta lipsă, și cu un
-- `grant ... to anon` adăugat, `supabase/verificare-izolare.sql` pică.
revoke all on function public.inregistreaza_afisarea(uuid, date, text) from public;
grant execute on function public.inregistreaza_afisarea(uuid, date, text) to service_role;
