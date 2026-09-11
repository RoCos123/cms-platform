-- ----------------------------------------------------------------------------
-- Clonarea unui site: același conținut, alt șablon, alt domeniu.
--
-- La ce e: să faci repede site-uri-model pe fiecare șablon, pornind de la unul
-- deja scris — ca să compari șabloanele pe conținut real, nu pe „lorem ipsum".
--
-- Cum copiază, și de ce NU e „aproximativ": nu rescrie nimic din conținut, ci
-- copiază RÂNDURILE exact, cu un ajutor care își ia coloanele din catalog la
-- rulare (`_cloneaza_tabel`). Adică dacă mâine o migrare adaugă o coloană nouă
-- pe `site_content`, clona o ia automat — nu rămâne în urmă o listă scrisă de
-- mână. Se probează pe banc: se clonează un site seedat și se numără rând cu
-- rând că totul a ajuns dincolo.
--
-- CE COPIAZĂ: setările (brand, SEO…), secțiunile paginii principale, paginile,
-- serviciile, blogul (categorii + articole).
--
-- CE NU COPIAZĂ, dinadins:
--   • Pozele. Fișierele din depozit sunt încuiate pe fiecare site (calea începe
--     cu site_id-ul lui), deci o poză a sursei nu se poate arăta pe clonă.
--     Referințele către copertă (`cover_upload_id`) se pun pe NULL, ca să nu
--     rămână o legătură moartă; se reîncarcă pozele pe fiecare clonă.
--   • Datele vizitatorilor (mesaje de contact, programări, statistici, jurnal,
--     abonați la newsletter). Alea sunt ale site-ului real, n-au ce căuta pe un
--     model.
--
-- CE REMAPEAZĂ:
--   • Categoriile de blog primesc id-uri NOI; articolele se leagă de categoria
--     clonată, nu de a sursei.
--   • Autorul articolelor devine contul clonei.
-- ----------------------------------------------------------------------------

-- Ajutor INTERN: copiază rândurile unui tabel de la un site la altul, cu
-- coloanele citite din catalog (deci nu ratează niciuna). `p_overrides` dă, pe
-- coloană, o EXPRESIE SQL de folosit în locul valorii copiate (ex. `site_id`
-- forțat pe țintă, `cover_upload_id` pus pe null). Expresiile sunt scrise de noi
-- aici, nu vin din afară.
--
-- Nu e `security definer`: rulează cu drepturile celui care-l cheamă —
-- `cloneaza_site`, care e definer și rulează ca proprietarul bazei.
create or replace function public._cloneaza_tabel(
  p_tabel text,
  p_sursa uuid,
  p_overrides jsonb
) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_col text;
  v_insert text := '';
  v_select text := '';
  v_n integer;
begin
  for v_col in
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = p_tabel
      -- `created_at`/`updated_at` se lasă pe seama defaultului (acum, nu data
      -- sursei). `id` la fel — DOAR dacă nu e cerut explicit în overrides (cazul
      -- categoriilor, care au nevoie de id nou dar cunoscut).
      and column_name not in ('created_at', 'updated_at')
    order by ordinal_position
  loop
    if v_col = 'id' and not (p_overrides ? 'id') then
      continue;
    end if;

    if v_insert <> '' then
      v_insert := v_insert || ', ';
      v_select := v_select || ', ';
    end if;

    v_insert := v_insert || quote_ident(v_col);
    if p_overrides ? v_col then
      v_select := v_select || (p_overrides ->> v_col);
    else
      v_select := v_select || quote_ident(v_col);
    end if;
  end loop;

  execute format(
    'insert into public.%I (%s) select %s from public.%I where site_id = %L',
    p_tabel, v_insert, v_select, p_tabel, p_sursa
  );
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Ajutorul nu e chemabil din afară: îl folosește doar `cloneaza_site`, printr-un
-- apel direct (nu prin RPC). Revocat de la toate rolurile expuse.
revoke all on function public._cloneaza_tabel(text, uuid, jsonb) from public, anon, authenticated, service_role;


create or replace function public.cloneaza_site(
  p_sursa_domeniu text,
  p_tinta_domeniu text,
  p_tinta_nume text,
  p_tinta_email text,
  p_tinta_sablon text default 'caldura'
)
returns jsonb
language plpgsql
-- `security definer`: scrie în `auth.users` (citire) și în tabele cu RLS, la fel
-- ca `creeaza_client`. O cheamă proprietarul platformei.
security definer
set search_path = ''
as $$
declare
  v_sursa uuid;
  v_tinta uuid;
  v_user uuid;
  v_map jsonb := '{}'::jsonb;
  v_cat_id uuid;
  n_setari int; n_sectiuni int; n_pagini int; n_servicii int;
  n_categorii int := 0; n_articole int;
begin
  p_sursa_domeniu := lower(btrim(p_sursa_domeniu));
  p_tinta_domeniu := lower(btrim(p_tinta_domeniu));
  p_tinta_email := lower(btrim(p_tinta_email));
  p_tinta_nume := btrim(p_tinta_nume);

  if p_sursa_domeniu = '' or p_tinta_domeniu = '' or p_tinta_nume = '' or p_tinta_email = '' then
    raise exception 'Domeniul sursă, domeniul țintă, numele și emailul sunt toate obligatorii.';
  end if;
  if p_tinta_domeniu like 'http%' or p_tinta_domeniu like '%/%' then
    raise exception 'Scrie doar domeniul țintă, fără https:// și fără cale: %', p_tinta_domeniu;
  end if;
  if p_tinta_domeniu = p_sursa_domeniu then
    raise exception 'Domeniul țintă e chiar sursa. Alege alt domeniu.';
  end if;
  if p_tinta_sablon not in ('caldura', 'liniste', 'lumina', 'apropiere', 'claritate') then
    raise exception 'Șablon necunoscut: %. Cele existente: caldura, liniste, lumina, apropiere, claritate.', p_tinta_sablon;
  end if;

  select id into v_sursa from public.sites where domain = p_sursa_domeniu;
  if v_sursa is null then
    raise exception 'Nu există niciun site sursă cu domeniul %.', p_sursa_domeniu;
  end if;

  if exists (select 1 from public.sites where domain = p_tinta_domeniu) then
    raise exception 'Domeniul % are deja un site. Dacă vrei să-l refaci, șterge-l întâi.', p_tinta_domeniu;
  end if;

  select id into v_user from auth.users where lower(email) = p_tinta_email;
  if v_user is null then
    raise exception
      'Nu există niciun cont cu emailul %. Creează-l întâi din Dashboard → Authentication → Users, cu „Auto Confirm User" bifat.',
      p_tinta_email;
  end if;
  if exists (select 1 from public.users where id = v_user) then
    raise exception 'Contul % e deja legat de un site. Un cont aparține unui singur cabinet.', p_tinta_email;
  end if;

  -- Site nou, cu șablonul cerut. `appointments_enabled` se copiază de la sursă
  -- la INSERT: trigger-ul care adaugă secțiunea de programare e pe UPDATE, deci
  -- nu se declanșează aici — pe cea de programare o aducem noi, din secțiunile
  -- sursei, ca să nu iasă două.
  insert into public.sites (domain, name, template, appointments_enabled)
  select p_tinta_domeniu, p_tinta_nume, p_tinta_sablon, s.appointments_enabled
  from public.sites s where s.id = v_sursa
  returning id into v_tinta;

  insert into public.users (id, site_id, email) values (v_user, v_tinta, p_tinta_email);

  -- Setările (brand, seo, social, analytics și tot ce mai e în rând).
  n_setari := public._cloneaza_tabel('site_settings', v_sursa,
    jsonb_build_object('site_id', quote_literal(v_tinta)));

  -- Secțiunile paginii principale, exact ca la sursă: poziții, tonuri,
  -- vizibilitate, is_demo, conținut.
  n_sectiuni := public._cloneaza_tabel('site_content', v_sursa,
    jsonb_build_object('site_id', quote_literal(v_tinta)));

  -- Paginile (inclusiv ciorna de politică de confidențialitate).
  n_pagini := public._cloneaza_tabel('pages', v_sursa,
    jsonb_build_object('site_id', quote_literal(v_tinta)));

  -- Serviciile. Coperta pe NULL: pozele nu se copiază.
  n_servicii := public._cloneaza_tabel('services', v_sursa,
    jsonb_build_object('site_id', quote_literal(v_tinta), 'cover_upload_id', 'null'));

  -- Blog: întâi categoriile, cu id-uri NOI ținute într-o hartă vechi→nou, ca
  -- articolele să se lege de categoria clonată, nu de a sursei.
  for v_cat_id in select id from public.blog_categories where site_id = v_sursa loop
    v_map := v_map || jsonb_build_object(v_cat_id::text, gen_random_uuid()::text);
    n_categorii := n_categorii + 1;
  end loop;

  if n_categorii > 0 then
    perform public._cloneaza_tabel('blog_categories', v_sursa, jsonb_build_object(
      'id', format('(%L::jsonb ->> id::text)::uuid', v_map),
      'site_id', quote_literal(v_tinta)
    ));
  end if;

  -- Articolele: categoria remapată prin hartă, autorul → contul clonei, coperta
  -- → NULL (aceeași poveste cu pozele).
  n_articole := public._cloneaza_tabel('blog_articles', v_sursa, jsonb_build_object(
    'site_id', quote_literal(v_tinta),
    'author_id', quote_literal(v_user),
    'cover_upload_id', 'null',
    'category_id', format('(%L::jsonb ->> category_id::text)::uuid', v_map)
  ));

  return jsonb_build_object(
    'site_id', v_tinta,
    'domeniu', p_tinta_domeniu,
    'sablon', p_tinta_sablon,
    'copiat_din', p_sursa_domeniu,
    'setari', n_setari,
    'sectiuni', n_sectiuni,
    'pagini', n_pagini,
    'servicii', n_servicii,
    'categorii', n_categorii,
    'articole', n_articole,
    'urmatorii_pasi', jsonb_build_array(
      'Conectează domeniul în Vercel (un subdomeniu .vercel.app pentru probă).',
      'Reîncarcă pozele — nu se copiază, sunt încuiate pe fiecare site.'
    )
  );
end;
$$;

-- Nimeni din browser (anon/authenticated) n-o poate chema: clonează site-uri și
-- leagă conturi. O cheamă proprietarul platformei, server-side.
--
-- Se revocă și de la `public`, nu doar de la roluri: o funcție nouă primește
-- din start EXECUTE către PUBLIC, iar anon/authenticated l-ar moșteni de acolo
-- chiar și după ce li se ia grantul lor explicit (cel dat de Supabase). Amândouă
-- sunt necesare — vezi CONVENTII, §„Ce se revocă de la PUBLIC nu e revocat de la
-- roluri", și prins de verificarea de izolare pe banc.
revoke execute on function public.cloneaza_site(text, text, text, text, text) from public, anon, authenticated;
