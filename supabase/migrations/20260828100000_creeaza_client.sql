-- ----------------------------------------------------------------------------
-- Punerea în funcțiune a unui client, dintr-o linie.
--
-- Înainte: vreo 20 de linii de SQL scrise de mână, în cinci tabele, cu id-ul
-- site-ului căutat și lipit peste tot. Nimic nu verifica dacă s-au făcut toți
-- pașii, iar cel mai urât caz era copiatul de la clientul anterior cu domeniul
-- neschimbat — adică scris peste site-ul altcuiva.
--
-- Acum:
--   select public.creeaza_client(
--     'cabinet-rodica.ro',
--     'Cabinet Individual de Psihologie Rodica Ionescu',
--     'rodica@exemplu.ro',
--     'caldura',
--     true              -- cu modulul Programări
--   );
--
-- Ori toate, ori niciuna: o funcție rulează într-o singură tranzacție, deci
-- dacă pică la jumătate nu rămâne un client făcut pe jumătate — care e mai rău
-- decât niciunul, fiindcă arată ca și cum ar merge.
--
-- CE NU FACE, dinadins:
--
-- 1. Nu creează contul de login. Scrierea directă în `auth.users` cere parole
--    criptate în tabelele interne ale Supabase — merge, dar se strică la o
--    actualizare de-a lor. Contul se face din Dashboard → Authentication →
--    Users (cu „Auto Confirm User" bifat), iar funcția îl caută după email și
--    refuză dacă nu-l găsește.
-- 2. Nu conectează domeniul în Vercel. Aia n-are cum s-o facă baza de date.
-- 3. Nu publică nicio pagină legală. Politica de confidențialitate se creează
--    ca CIORNĂ, cu un text care spune ce trebuie scris în ea. Un document
--    juridic șablon, publicat automat sub numele unui cabinet, e mai rău decât
--    lipsa lui.
-- ----------------------------------------------------------------------------

create or replace function public.creeaza_client(
  p_domeniu text,
  p_nume text,
  p_email text,
  p_sablon text default 'caldura',
  p_cu_programari boolean default false
)
returns jsonb
language plpgsql
-- `security definer` fiindcă funcția scrie în `auth.users` (citire) și în
-- tabele cu RLS. O cheamă proprietarul platformei din SQL Editor, unde rulează
-- oricum ca `postgres`; definer o face să meargă la fel dacă e chemată altfel.
security definer
set search_path = ''
as $$
declare
  v_site uuid;
  v_user uuid;
  v_sectiuni int;
begin
  -- Aceeași normalizare ca la rezolvarea tenantului (`normalizeHost` din
  -- src/lib/tenant.ts): un domeniu scris cu majuscule sau cu spații în plus ar
  -- da un site care nu se deschide niciodată, iar cauza nu s-ar vedea nicăieri.
  p_domeniu := lower(btrim(p_domeniu));
  p_email := lower(btrim(p_email));
  p_nume := btrim(p_nume);

  if p_domeniu = '' or p_nume = '' or p_email = '' then
    raise exception 'Domeniul, numele cabinetului și emailul sunt toate obligatorii.';
  end if;

  if p_domeniu like 'http%' or p_domeniu like '%/%' then
    raise exception 'Scrie doar domeniul, fără https:// și fără cale: % ', p_domeniu;
  end if;

  /*
   * Lista se ține de mână, în oglindă cu `TEMPLATES` din
   * src/lib/templates/index.ts. E singurul loc din proiect cu două surse de
   * adevăr, iar alternativa e mai rea: fără verificare, o cheie scrisă greșit
   * („liniste" fără diacritice e bine, dar „linste" nu) trece în tăcere, iar
   * `getTemplate` întoarce implicitul. Clientul ar primi alt șablon decât a
   * ales, și nimeni n-ar afla până nu s-ar uita cineva la site.
   *
   * DE ACTUALIZAT când se adaugă un șablon nou.
   */
  if p_sablon not in ('caldura', 'liniste', 'lumina', 'apropiere') then
    raise exception 'Șablon necunoscut: %. Cele existente: caldura, liniste, lumina, apropiere.', p_sablon;
  end if;

  if exists (select 1 from public.sites where domain = p_domeniu) then
    raise exception 'Domeniul % are deja un site. Dacă vrei să-l refaci, șterge-l întâi.', p_domeniu;
  end if;

  select id into v_user from auth.users where lower(email) = p_email;

  if v_user is null then
    raise exception
      'Nu există niciun cont cu emailul %. Creează-l întâi din Dashboard → Authentication → Users, cu „Auto Confirm User" bifat.',
      p_email;
  end if;

  if exists (select 1 from public.users where id = v_user) then
    raise exception 'Contul % e deja legat de un site. Un cont aparține unui singur cabinet.', p_email;
  end if;

  insert into public.sites (domain, name, template)
  values (p_domeniu, p_nume, p_sablon)
  returning id into v_site;

  insert into public.users (id, site_id, email) values (v_user, v_site, p_email);

  -- Setările pornesc goale, nu cu date inventate: un telefon de exemplu, rămas
  -- neschimbat, ar fi apărut în subsol pe un site public.
  insert into public.site_settings (site_id) values (v_site);

  /*
   * Secțiunile paginii principale: structura validată a șablonului „Căldură"
   * (design/sabloane/README.md), care le conține pe toate ale celorlalte trei.
   *
   * Toate `is_demo = true`: cad la prima editare a clientului, iar ecranul de
   * acasă numără câte au mai rămas.
   *
   * Doar HERO și CONTACT pornesc vizibile. Restul sunt ascunse, și e dinadins:
   * site-ul devine public din clipa în care domeniul rezolvă, iar un cabinet cu
   * paisprezece secțiuni goale arată a defect. Așa, ziua întâi arată curat, iar
   * clientul aprinde fiecare secțiune pe măsură ce o scrie.
   */
  insert into public.site_content (site_id, key, tone, position, visible, is_demo, data)
  select
    v_site, v.cheie, v.ton, v.pozitie, v.vizibil, true,
    case v.cheie
      when 'hero' then jsonb_build_object(
        'titlu', p_nume,
        'subtitlu', 'Scrie aici câteva rânduri despre tine și despre felul în care lucrezi.'
      )
      when 'contact' then jsonb_build_object(
        'titlu', 'Hai să vorbim',
        'intro', 'Scrie-mi câteva rânduri și îți răspund.'
      )
      else '{}'::jsonb
    end
  from (values
    ('hero',        'deschis',  10, true),
    ('aboutTeaser', 'nuantat',  20, false),
    ('quote',       'deschis',  30, false),
    ('features',    'deschis',  40, false),
    ('howItWorks',  'inchis',   50, false),
    ('quote',       'inchis',   60, false),
    ('logos',       'nuantat',  65, false),
    ('testimonials','relief',   70, false),
    ('portfolio',   'nuantat',  75, false),
    ('latestPosts', 'deschis',  80, false),
    ('faq',         'deschis',  90, false),
    ('newsletter',  'inchis',   95, false),
    ('contact',     'relief',  100, true)
  ) as v(cheie, ton, pozitie, vizibil);

  get diagnostics v_sectiuni = row_count;

  -- Ciornă, nu publicată. Textul spune ce trebuie scris, ca clientul să nu se
  -- uite la o pagină goală și să nu știe de unde s-o ia.
  insert into public.pages (site_id, slug, title, content, status, nav_location)
  values (
    v_site,
    'politica-de-confidentialitate',
    'Politica de confidențialitate',
    E'Aceasta e o ciornă. Scrie aici, cu cuvintele tale:\n\n'
    '- cine ești ca operator de date (numele cabinetului și CUI-ul);\n'
    '- ce date se strâng prin formularele de pe site și de ce;\n'
    '- cât timp le păstrezi și cine mai are acces la ele;\n'
    '- ce drepturi are omul și cum le poate cere.\n\n'
    'Mesajele primite prin formularul de contact pot conține informații despre '
    'sănătatea cuiva, deci cerințele sunt mai stricte decât la un site obișnuit. '
    'Publică pagina abia după ce textul e al tău.',
    'draft',
    'footer'
  );

  if p_cu_programari then
    -- Trigger-ul din migrarea `sectiunea_programare` adaugă și secțiunea.
    update public.sites set appointments_enabled = true where id = v_site;
  end if;

  return jsonb_build_object(
    'site_id', v_site,
    'domeniu', p_domeniu,
    'nume', p_nume,
    'sablon', p_sablon,
    'cont_legat', p_email,
    'sectiuni_create', v_sectiuni,
    'programari', p_cu_programari,
    'urmatorii_pasi', jsonb_build_array(
      'Conectează domeniul în Vercel și pune înregistrările DNS la registrar.',
      'Trimite-i parola clientului — nu există resetare de parolă încă.',
      'Scrie politica de confidențialitate și public-o; acum e ciornă.'
    )
  );
end;
$$;

-- Nimeni în afară de proprietarul platformei n-are ce căuta aici: funcția
-- creează site-uri și leagă conturi. `public` include `anon` și
-- `authenticated`, adică vizitatorii și clienții.
revoke execute on function public.creeaza_client(text, text, text, text, boolean) from public;
