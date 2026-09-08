-- ============================================================================
-- Site-ul nou își arată scheletul: fiecare secțiune, cu numele ei ca text de
-- pornire.
--
-- DE CE. Până acum secțiunile porneau cu `{}`. Aprinse toate, dar goale, nu
-- desenau nimic — iar clientul deschidea site-ul și vedea două secțiuni, în
-- timp ce panoul îi spunea că sunt paisprezece „vizibile". Panoul mințea, iar
-- omul n-avea de unde ști ce are de completat și în ce ordine.
--
-- Acum fiecare pornește cu titlul pe care îl poartă și în panou. Site-ul arată
-- ca un cuprins al lui însuși: „Despre mine", „Serviciile mele", „Păreri",
-- „Întrebări frecvente". Clientul le rescrie pe rând, iar `is_demo` cade la
-- prima editare — ecranul de acasă numără câte au mai rămas cu textul nostru.
--
-- CE NU FACE. Nu ascunde nimic la publicare. Dacă cineva publică site-ul cu
-- titluri goale dedesubt, alea se văd. E alegerea lui: panoul îi spune înainte
-- câte secțiuni mai poartă text pus de noi.
-- ============================================================================

create or replace function public.textul_de_pornire(p_cheie text, p_nume text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  /*
   * Numele sunt cele din `metaSectiune` (src/lib/sectiuni.ts), ca omul să
   * regăsească pe site exact eticheta pe care o apasă în panou. Al patrulea loc
   * unde trăiește aceeași listă — de-aia proba `e2e/schelet-sql.proba.mjs` o
   * compară cu panoul și cade dacă se despart.
   */
  select case p_cheie
    when 'hero'         then jsonb_build_object(
                              'titlu', p_nume,
                              'subtitlu', 'Scrie aici câteva rânduri despre tine și despre felul în care lucrezi.')
    when 'aboutTeaser'  then jsonb_build_object('titlu', 'Despre mine')
    when 'quote'        then jsonb_build_object(
                              'citat', 'Aici pui un citat scurt — o vorbă de-a ta, sau una care te reprezintă.')
    when 'features'     then jsonb_build_object('titlu', 'Serviciile mele')
    when 'howItWorks'   then jsonb_build_object('titlu', 'Cum decurge colaborarea')
    when 'logos'        then jsonb_build_object('titlu', 'Apariții și acreditări')
    when 'testimonials' then jsonb_build_object('titlu', 'Păreri')
    when 'portfolio'    then jsonb_build_object('titlu', 'Programe și materiale')
    when 'pricing'      then jsonb_build_object('titlu', 'Pachete')
    when 'latestPosts'  then jsonb_build_object('titlu', 'Articole recente')
    when 'faq'          then jsonb_build_object('titlu', 'Întrebări frecvente')
    when 'newsletter'   then jsonb_build_object('titlu', 'Newsletter')
    when 'programare'   then jsonb_build_object('titlu', 'Programare online')
    when 'contact'      then jsonb_build_object(
                              'titlu', 'Hai să vorbim',
                              'intro', 'Lasă-mi numele și numărul, te sun eu.')
    else '{}'::jsonb
  end;
$$;

comment on function public.textul_de_pornire(text, text) is
  'Textul cu care pornește o secțiune la provizionare. Numele sunt cele din panou.';

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
  if p_sablon not in ('caldura', 'liniste', 'lumina', 'apropiere', 'claritate') then
    raise exception 'Șablon necunoscut: %. Cele existente: caldura, liniste, lumina, apropiere, claritate.', p_sablon;
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
   * TOATE pornesc vizibile. Era altfel — doar hero și contact — fiindcă site-ul
   * devenea public din clipa în care domeniul rezolva, iar un cabinet cu
   * paisprezece secțiuni goale arăta a defect. De când există comutatorul de
   * lansare (`sites.published_at`), nimeni din afară nu vede site-ul până nu-l
   * publică chiar clientul, deci grija aia a dispărut.
   *
   * Iar acum e chiar invers decât înainte: clientul primește un site gol și
   * învață din el ce poate avea. Ce nu vede, nu știe că există — un om care
   * n-a lucrat niciodată cu un panou nu se duce să caute secțiuni ascunse. E
   * mai ușor să ștergi ce nu-ți trebuie decât să ghicești ce ți-ar fi trebuit.
   * Hotărât de proprietar, 31 aug. 2026.
   */
  insert into public.site_content (site_id, key, tone, position, visible, is_demo, data)
  select
    v_site, v.cheie, v.ton, v.pozitie, v.vizibil, true,
    public.textul_de_pornire(v.cheie, p_nume)
  from (values
    ('hero',        'deschis',  10, true),
    ('aboutTeaser', 'nuantat',  20, true),
    ('quote',       'deschis',  30, true),
    ('features',    'deschis',  40, true),
    ('howItWorks',  'inchis',   50, true),
    ('quote',       'inchis',   60, true),
    ('logos',       'nuantat',  65, true),
    ('testimonials','relief',   70, true),
    ('portfolio',   'nuantat',  75, true),
    ('pricing',     'deschis',  78, true),
    ('latestPosts', 'deschis',  80, true),
    ('faq',         'deschis',  90, true),
    ('newsletter',  'inchis',   95, true),
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
      'Site-ul e NEPUBLICAT: îl vede doar clientul, logat. Îl publică el, din Setări, când e gata.',
      'Politica de confidențialitate e ciornă. Panoul îl avertizează pe client înainte de publicare, dar nu-l oprește.'
    ),
    'publicat', false
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Site-urile deja provizionate: le punem textul de pornire acum.
--
-- Doar rândurile pe care clientul nu le-a atins — `is_demo` cade la prima lui
-- editare, iar `data = '{}'` înseamnă că n-a scris nimic acolo. Un site pe care
-- s-a lucrat deja rămâne exact cum e.
-- ----------------------------------------------------------------------------
update public.site_content c
set data = public.textul_de_pornire(c.key, s.name)
from public.sites s
where s.id = c.site_id
  and c.is_demo
  and c.data = '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- Secțiunea de programare vine pe altă ușă: un declanșator o adaugă în clipa în
-- care se pornește modulul plătit, nu la provizionare. Punea și ea `{}`, deci
-- clientul care tocmai cumpărase modulul nu vedea nimic apărând pe site.
--
-- Rândurile deja adăugate, la fel: doar cele neatinse.
-- ----------------------------------------------------------------------------
update public.site_content c
set data = public.textul_de_pornire('programare', s.name)
from public.sites s
where s.id = c.site_id
  and c.key = 'programare'
  and c.data = '{}'::jsonb;
