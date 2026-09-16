-- ----------------------------------------------------------------------------
-- Clonarea nu mai duce mai departe referințele la fișiere din secțiuni.
--
-- CE SE REPARĂ. `cloneaza_site` copia `site_content` verbatim, cu tot cu
-- obiectele de imagine (`{ uploadId, url, ... }`) și de material
-- (`{ fisierId, url }`) din interiorul `data`. Coperțile de serviciu și de
-- articol erau deja puse pe NULL (pozele nu se copiază), dar referințele din
-- CONȚINUTUL secțiunilor scăpau. Iar adresa unui fișier se semnează după `id`,
-- nu după `site_id` — deci un site CLONAT ajungea să afișeze chiar pozele și
-- documentele site-ului-sursă. Nu era o scurgere per vizitator (RLS ține
-- fiecare fișier încuiat pe site-ul lui în depozit), dar la clonarea unui client
-- real i-ar fi arătat materialele altuia până le înlocuia de mână.
--
-- CUM. La copierea `site_content`, câmpul `data` trece printr-un curățător care
-- scoate exact obiectele de fișier, oricât de adânc ar sta — la fel ca la
-- coperți, dar înăuntrul JSON-ului. Restul conținutului (titluri, texte,
-- pozițiile din pagină, textul butoanelor) rămâne neatins. E aceeași semantică
-- pe care o are ștergerea unei imagini din panou (`scoateIncarcarea` în
-- `src/lib/imagini.ts`): câmpul dispare cu totul, fiindcă site-ul verifică
-- `{imagine && …}`, deci un câmp absent nu randează nimic, pe când unul rămas cu
-- un `url` mort ar arăta o imagine ruptă.
-- ----------------------------------------------------------------------------

-- Recunoaște un obiect de fișier — poză (`uploadId`) sau material (`fisierId`) —
-- după FORMĂ, nu după numele câmpului care-l ține. Aceeași regulă ca
-- `esteImagine`/`esteFisier` din `src/lib/imagini.ts`: un id gol nu contează
-- (`""` nu e o referință adevărată), ca să nu scoatem un obiect pe jumătate scris.
-- `coalesce(..., false)` NU e de prisos: pentru un obiect fără cheia `uploadId`,
-- `p -> 'uploadId'` e NULL, iar comparațiile pe NULL dau NULL — deci fără
-- coalesce predicatul întorcea NULL în loc de `false` pentru un obiect obișnuit
-- (ex. un element de portofoliu). Iar `where not <NULL>` scoate rândul din
-- greșeală: pe 15 sept. 2026, exact așa, curățarea a golit un `elemente` întreg
-- de la o clonă, prins de banc.
create or replace function public._este_referinta_fisier(p jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p) = 'object'
    and (
      (jsonb_typeof(p -> 'uploadId') = 'string' and length(p ->> 'uploadId') > 0)
      or
      (jsonb_typeof(p -> 'fisierId') = 'string' and length(p ->> 'fisierId') > 0)
    ),
    false);
$$;

revoke all on function public._este_referinta_fisier(jsonb) from public, anon, authenticated, service_role;


-- Scoate din conținutul unei secțiuni toate referințele la fișiere, oricât de
-- adânc ar sta. Merge recursiv prin JSON: la fiecare obiect sau listă, sare
-- peste câmpurile/elementele care SUNT referințe la fișier (cheia dispare,
-- elementul dispare) și coboară în rest. Scalarii rămân cum sunt.
--
-- `plpgsql`, nu `sql`, dinadins: o funcție `sql` care se cheamă pe sine e
-- validată la creare, când încă nu există — și pică. `plpgsql` amână rezolvarea
-- numelor la rulare, deci recursia trece.
create or replace function public._curata_incarcarile(p_data jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_data is null then
    return null;
  end if;

  if jsonb_typeof(p_data) = 'object' then
    -- `coalesce` pe gol: dacă TOATE câmpurile erau referințe la fișier,
    -- `jsonb_object_agg` întoarce NULL — vrem un obiect gol, nu un NULL.
    return coalesce(
      (select jsonb_object_agg(k, public._curata_incarcarile(v))
         from jsonb_each(p_data) as e(k, v)
        where not public._este_referinta_fisier(v)),
      '{}'::jsonb);
  elsif jsonb_typeof(p_data) = 'array' then
    -- `order by ord`: filtrarea nu are voie să reașeze elementele rămase.
    return coalesce(
      (select jsonb_agg(public._curata_incarcarile(v) order by ord)
         from jsonb_array_elements(p_data) with ordinality as e(v, ord)
        where not public._este_referinta_fisier(v)),
      '[]'::jsonb);
  else
    return p_data;
  end if;
end;
$$;

revoke all on function public._curata_incarcarile(jsonb) from public, anon, authenticated, service_role;


-- Aceeași funcție ca înainte; singura schimbare de comportament e la copierea
-- `site_content`: `data` trece prin `_curata_incarcarile`. Restul e neatins.
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

  -- Secțiunile paginii principale: poziții, tonuri, vizibilitate, is_demo,
  -- conținut — dar `data` trecut prin `_curata_incarcarile`, ca referințele la
  -- pozele și documentele sursei să NU ajungă pe clonă (aceeași poveste cu
  -- pozele ca la coperți, doar că înăuntrul JSON-ului). Clientul reîncarcă
  -- fișierele pe clonă.
  n_sectiuni := public._cloneaza_tabel('site_content', v_sursa,
    jsonb_build_object(
      'site_id', quote_literal(v_tinta),
      'data', 'public._curata_incarcarile(data)'));

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
      'Reîncarcă pozele și documentele — nu se copiază, sunt încuiate pe fiecare site.'
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
