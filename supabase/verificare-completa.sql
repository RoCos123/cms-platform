-- ============================================================================
-- Verificarea amănunțită: formă, comportament și date.
--
-- GENERAT din `supabase/genereaza-verificare-schema.sh`. Nu se scrie de mână.
--
-- CUM SE RULEAZĂ
--   Supabase → SQL Editor → New query → tot fișierul → Run, FĂRĂ text selectat.
--   Scrie un singur tabel, cu o linie per verificare.
--
-- CE ÎNSEAMNĂ COLOANA `zona`
--   comportament — chiar se încearcă: un client care caută datele altuia, un
--                  vizitator anonim care scrie, o funcție a platformei chemată
--                  de cine nu trebuie. Astea nu se pot deduce din schemă.
--   formă        — cele 259 de lucruri din schemă, față de migrări.
--   date         — ce nu poate opri nicio schemă, dar strică site-ul cuiva.
--
-- CE SCHIMBĂ. Aproape nimic, și nimic ce rămâne: `search_path`-ul sesiunii, o
-- funcție temporară care dispare la închidere, și o singură scriere care TREBUIE
-- respinsă — dacă totuși trece, rândul se șterge pe loc și verificarea dă PICAT.
--
-- CU UN SINGUR CLIENT în bază, comparațiile între clienți se sar și scriu „NU SE
-- POATE"; restul rulează. Un tabel gol ar fi fost mai rău: se citește ușor drept
-- „e bine".
-- ============================================================================

set search_path = public;

-- (1) Verificarea de comportament, adusă întreagă din verificare-izolare.sql.
-- ============================================================================
-- Verificare de comportament: datele unui client nu ajung la alt client, și
-- nimeni nu poate face ce n-are voie — DOVEDIT încercând, nu citind.
--
-- E aceeași verificare pe care o face `e2e/tenant-rls.spec.ts`, dar rescrisă
-- ca să poată fi rulată direct în SQL Editor din Supabase — fără terminal,
-- fără Node, fără variabile de mediu.
--
-- CUM SE RULEAZĂ
--   Supabase → SQL Editor → New query → lipești TOT fișierul → Run.
--   Fără text selectat. Rezultatul e un tabel cu o linie per verificare.
--
-- NU LASĂ NIMIC ÎN URMĂ — prin construcție, nu prin grijă. Fiecare probă care
-- scrie rulează într-o sub-tranzacție care se ANULEAZĂ întotdeauna: și când
-- apărarea a ținut, și când n-a ținut. Nu există „pune la loc", fiindcă nu
-- rămâne nimic de pus la loc. Iar la sfârșit se numără din nou rândurile din
-- fiecare tabel și rândul clientului de probă, și se compară cu cele de la
-- început — dovada se citește, nu se presupune. Înainte de 9 sept. 2026,
-- verificarea asta chiar scria într-un rând adevărat și-l lăsa așa.
--
-- PRINDE ȘI CE N-A PREVĂZUT NIMENI. Nicio listă de tabele, coloane, funcții
-- sau depozite nu e scrisă aici de mână: se iau din catalog. Un tabel adăugat
-- mâine fără RLS, o coloană nouă pe `sites` dată din greșeală clientului, o
-- funcție `security definer` chemabilă din browser — toate sunt prinse fără ca
-- cineva să le fi trecut undeva.
--
-- CU UN SINGUR CLIENT în bază, comparațiile între clienți se sar și scriu
-- „NU SE POATE"; restul rulează. Un tabel gol ar fi fost mai rău: se citește
-- ușor drept „e bine".
-- ============================================================================

create or replace function pg_temp.verifica_izolarea()
returns table (verificare text, verdict text, detaliu text)
language plpgsql
as $$
declare
  user_a uuid; site_a uuid;
  user_b uuid; site_b uuid;
  al_lui uuid; site_lui uuid;
  randuri bigint; straine bigint; ale_altora bigint;
  dovedite int; fara_ce int; refuzate int;
  tabel text; coloana text;
  scurgeri text; netestate text; refuzuri text; lista text;
  scriibile text[] := '{}';
  -- Fotografiile de la început, pentru plasa de siguranță de la sfârșit.
  inainte jsonb := '{}'; dupa jsonb := '{}';
  rand_inainte jsonb; rand_dupa jsonb;
begin
  -- --------------------------------------------------------------------------
  -- 0. Fotografia de la început: câte rânduri are fiecare tabel.
  --
  -- Se compară la sfârșit. Dacă vreo probă ar lăsa ceva în urmă — inclusiv una
  -- scrisă greșit de acum înainte — aici se vede, cu numele tabelului.
  -- --------------------------------------------------------------------------
  for tabel in
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and (n.nspname = 'public'
           or (n.nspname = 'storage' and c.relname in ('objects', 'buckets'))
           or (n.nspname = 'auth' and c.relname = 'users'))
    order by 1
  loop
    execute format('select count(*) from %s', tabel) into randuri;
    inainte := inainte || jsonb_build_object(tabel, randuri);
  end loop;

  -- --------------------------------------------------------------------------
  -- 1. Doi useri din site-uri diferite.
  -- --------------------------------------------------------------------------
  select u.id, u.site_id into user_a, site_a
  from public.users u order by u.site_id, u.id limit 1;

  select u.id, u.site_id into user_b, site_b
  from public.users u where u.site_id <> site_a order by u.site_id, u.id limit 1;

  if user_a is null then
    return query select
      'Doi clienți de comparat'::text,
      'NU SE POATE'::text,
      'Nu există niciun site cu cont legat. Vezi supabase/seed-test-tenants.sql.'::text;
    return;
  end if;

  if user_b is null then
    return query select
      'Doi clienți de comparat'::text,
      'NU SE POATE'::text,
      'Un singur client în bază. Comparațiile între clienți se sar; restul rulează.'::text;
  else
    return query select 'Doi clienți de comparat'::text, 'OK'::text,
      format('%s și %s', site_a, site_b);
  end if;

  select to_jsonb(s) into rand_inainte from public.sites s where s.id = site_a;

  -- --------------------------------------------------------------------------
  -- 2. Fiecare client, logat, vede DOAR datele lui — în TOATE tabelele care au
  --    `site_id`, luate din catalog, nu dintr-o listă.
  --
  -- Interogări fără niciun filtru: dacă o politică ar fi greșită, rândurile
  -- celuilalt client ar ieși la iveală. Un tabel gol la clientul de test nu e
  -- o eroare, dar nici nu dovedește nimic — se numără separat.
  -- --------------------------------------------------------------------------
  for i in 1..(case when user_b is null then 1 else 2 end) loop
    al_lui   := case when i = 1 then user_a else user_b end;
    site_lui := case when i = 1 then site_a else site_b end;
    dovedite := 0; fara_ce := 0; refuzate := 0;
    scurgeri := ''; netestate := ''; refuzuri := '';

    for tabel in
      select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and (c.relname = 'sites' or exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'site_id'
            and a.attnum > 0 and not a.attisdropped))
      order by 1
    loop
      -- În `sites`, clientul E rândul; în rest, îl arată coloana `site_id`.
      coloana := case when tabel = 'sites' then 'id' else 'site_id' end;

      -- Câte rânduri ale ALTOR clienți există, văzute cu ochii bazei. Ăsta e
      -- numărul care hotărăște dacă verificarea dovedește ceva: un tabel în
      -- care nimeni altcineva n-are nimic n-are ce să scape.
      execute format(
        'select count(*) from public.%I where %I is distinct from $1', tabel, coloana
      ) into ale_altora using site_lui;

      begin
        perform set_config('role', 'authenticated', true);
        perform set_config('request.jwt.claims',
          json_build_object('sub', al_lui, 'role', 'authenticated')::text, true);

        execute format(
          'select count(*), count(*) filter (where %I is distinct from $1) from public.%I',
          coloana, tabel
        ) into randuri, straine using site_lui;

        perform set_config('role', 'postgres', true);

        if straine > 0 then
          scurgeri := scurgeri || format('%s (%s rânduri străine), ', tabel, straine);
        elsif ale_altora > 0 then
          dovedite := dovedite + 1;
        else
          fara_ce := fara_ce + 1;
          netestate := netestate || tabel || ', ';
        end if;
      exception when others then
        -- Refuzul NU e un răspuns bun aici: un client care nu-și poate citi
        -- PROPRIILE date n-are izolare bună, are panoul rupt.
        perform set_config('role', 'postgres', true);
        refuzate := refuzate + 1;
        refuzuri := refuzuri || tabel || ', ';
      end;
    end loop;

    perform set_config('request.jwt.claims', '', true);

    return query select
      format('Clientul %s vede doar datele lui', left(al_lui::text, 8))::text,
      case
        when scurgeri <> '' then 'PICAT'
        when refuzate > 0 then 'ATENȚIE'
        else 'OK'
      end::text,
      case
        when scurgeri <> '' then 'VEDE DATELE ALTUI CLIENT în: ' || rtrim(scurgeri, ', ')
        when refuzate > 0 then format(
          'nu-și poate citi propriile date din: %s — panoul ar da eroare acolo',
          rtrim(refuzuri, ', '))
        when fara_ce = 0 then format('%s tabele dovedite — n-a văzut niciun rând străin', dovedite)
        else format('%s tabele dovedite; %s fără date la alt client, deci nimic de scurs: %s',
                    dovedite, fara_ce, rtrim(netestate, ', '))
      end::text;
  end loop;

  -- --------------------------------------------------------------------------
  -- 3. Orice tabel din `public` aparține unui client.
  --
  -- Un tabel fără `site_id` nu poate fi izolat pe client, deci ori e o
  -- greșeală, ori e ceva ce trebuie hotărât pe față. Bucla de mai sus l-ar fi
  -- sărit în tăcere; aici se numește.
  --
  -- Două excepții, amândouă hotărâri, nu scăpări:
  --   • `sites` — clientul nu e un RÂND cu `site_id`, el E rândul (`id`).
  --   • `platform_owners` — e o tabelă a PLATFORMEI (cine ești TU, cel care le
  --     vede pe toate), nu a unui cabinet, deci n-are `site_id` dinadins.
  --     Izolarea pe tenant n-o apără; o apără altceva — RLS pornit fără nicio
  --     politică, plus drepturile revocate de la roluri. Scutirea asta NU e pe
  --     cuvânt: proba „Un client nu poate citi proprietarii platformei" (mai
  --     jos) o dovedește, semănând un proprietar și arătând că nu-l vede nimeni.
  -- --------------------------------------------------------------------------
  select string_agg(c.relname, ', ' order by c.relname) into lista
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname not in ('sites', 'platform_owners')
    and not exists (
      select 1 from pg_attribute a
      where a.attrelid = c.oid and a.attname = 'site_id'
        and a.attnum > 0 and not a.attisdropped);

  return query select
    'Orice tabel aparține unui client'::text,
    case when lista is null then 'OK' else 'ATENȚIE' end::text,
    coalesce('tabele fără site_id, pe care izolarea nu le poate apăra: ' || lista,
             'toate tabelele au site_id')::text;

  -- --------------------------------------------------------------------------
  -- 4. RLS e pornit pe fiecare tabel din `public`.
  --
  -- Fără RLS, politicile nu contează: tabelul e deschis cu totul pentru
  -- oricine are drept de citire — și drept de citire au toți, din start.
  -- --------------------------------------------------------------------------
  select string_agg(c.relname, ', ' order by c.relname) into lista
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  return query select
    'RLS e pornit pe fiecare tabel'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('tabele cu RLS OPRIT: ' || lista, 'toate tabelele au RLS pornit')::text;

  -- --------------------------------------------------------------------------
  -- 5. Un vizitator anonim nu poate citi nimic, din niciun tabel.
  --
  -- Cheia publishable stă în codul fiecărui site, deci oricine o poate lua.
  -- Lista tabelelor vine din catalog: unul nou, fără politici, e prins aici.
  -- --------------------------------------------------------------------------
  scurgeri := '';
  perform set_config('role', 'anon', true);

  for tabel in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by 1
  loop
    begin
      execute format('select count(*) from public.%I', tabel) into randuri;
      if randuri > 0 then
        scurgeri := scurgeri || format('%s (%s rânduri), ', tabel, randuri);
      end if;
    exception when others then
      null;  -- refuzul e răspunsul bun: nici măcar n-are voie să întrebe
    end;
  end loop;

  perform set_config('role', 'postgres', true);

  return query select
    'Un vizitator anonim nu poate citi date'::text,
    case when scurgeri = '' then 'OK' else 'PICAT' end::text,
    case when scurgeri = '' then 'niciun tabel nu întoarce rânduri'
         else 'citește din: ' || rtrim(scurgeri, ', ') end::text;

  -- Și conturile de login, care nu stau în `public`: un client conectat nu
  -- are ce căuta în lista tuturor conturilor platformei.
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    execute 'select count(*) from auth.users' into randuri;
    perform set_config('role', 'postgres', true);
    return query select
      'Un client nu poate citi conturile platformei'::text,
      'PICAT'::text,
      format('a citit auth.users: %s conturi', randuri)::text;
  exception when others then
    perform set_config('role', 'postgres', true);
    return query select
      'Un client nu poate citi conturile platformei'::text,
      'OK'::text,
      'respins: ' || SQLERRM;
  end;

  -- Și lista proprietarilor PLATFORMEI (`platform_owners`). E tabela trecută
  -- dinadins în excepția de la punctul 3 (n-are `site_id`), așa că aici i se
  -- apără scutirea: semănăm un proprietar, îl citim ca un CLIENT conectat, și
  -- dovedim că nu-l vede. Totul într-o sub-tranzacție anulată (`V0RBK`), deci nu
  -- rămâne niciun proprietar de probă — vezi CONVENTII, §„O probă care scrie nu
  -- pune la loc — se anulează".
  --
  -- Trece în DOUĂ feluri, fiindcă amândouă înseamnă „clientul nu vede nimic":
  -- refuzat din drepturi (cum e pe banc, unde revocarea prinde), SAU zero rânduri
  -- din RLS fără politică (cum ar fi în producție dacă revocarea de drept n-ar
  -- prinde). Pică doar dacă un rând chiar iese la iveală.
  begin
    insert into public.platform_owners (user_id, email)
    values (user_a, 'proba-izolare@exemplu.ro');

    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', user_a, 'role', 'authenticated')::text, true);

    begin
      execute 'select count(*) from public.platform_owners' into randuri;
    exception when others then
      randuri := -1;  -- refuzat din drepturi: nici măcar n-are voie să întrebe
    end;

    perform set_config('role', 'postgres', true);
    raise sqlstate 'V0RBK';
  exception when sqlstate 'V0RBK' then
    perform set_config('role', 'postgres', true);
    return query select
      'Un client nu poate citi proprietarii platformei'::text,
      case when randuri <= 0 then 'OK' else 'PICAT' end::text,
      case when randuri < 0 then 'respins din drepturi, deși există un proprietar'
           when randuri = 0 then 'nu vede niciun rând (RLS fără politică), deși există unul'
           else format('a citit %s proprietari — SCURGERE', randuri) end::text;
  end;

  -- --------------------------------------------------------------------------
  -- 6. Un vizitator anonim nu poate scrie în inboxul nimănui.
  --
  -- Prima probă care SCRIE. Rulează într-o sub-tranzacție încheiată cu o
  -- eroare a noastră (`V0RBK`), deci se anulează și când inserarea a trecut.
  -- Nu se șterge nimic după, fiindcă nu rămâne nimic.
  -- --------------------------------------------------------------------------
  begin
    perform set_config('role', 'anon', true);
    insert into public.contact_messages (site_id, name, email, message)
    values (site_a, 'VERIFICARE-IZOLARE', 'verificare@exemplu.ro', 'Ar fi trebuit respins.');
    raise sqlstate 'V0RBK';
  exception
    when sqlstate 'V0RBK' then
      perform set_config('role', 'postgres', true);
      return query select
        'Un vizitator anonim nu poate trimite mesaje direct în bază'::text,
        'PICAT'::text,
        'inserarea a trecut (anulată, n-a rămas nimic)'::text;
    when others then
      perform set_config('role', 'postgres', true);
      return query select
        'Un vizitator anonim nu poate trimite mesaje direct în bază'::text,
        'OK'::text,
        'respins: ' || SQLERRM;
  end;

  -- --------------------------------------------------------------------------
  -- 7. Un vizitator anonim nu poate umfla cifrele de trafic.
  --
  -- `inregistreaza_afisarea` e `security definer`: dacă anon o poate chema,
  -- scrie în panoul oricărui cabinet, cu orice `site_id`. Pe 9 sept. 2026 chiar
  -- putea, în producție, deși pe banc trecea.
  -- --------------------------------------------------------------------------
  begin
    perform set_config('role', 'anon', true);
    perform public.inregistreaza_afisarea(site_a, current_date, '/verificare-izolare');
    raise sqlstate 'V0RBK';
  exception
    when sqlstate 'V0RBK' then
      perform set_config('role', 'postgres', true);
      return query select
        'Un vizitator anonim nu poate umfla cifrele de trafic'::text,
        'PICAT'::text,
        'a putut chema inregistreaza_afisarea (anulat, n-a rămas nimic)'::text;
    when others then
      perform set_config('role', 'postgres', true);
      return query select
        'Un vizitator anonim nu poate umfla cifrele de trafic'::text,
        'OK'::text,
        'respins: ' || SQLERRM;
  end;

  -- --------------------------------------------------------------------------
  -- 8. În `sites`, clientul scrie EXACT unde are voie: `name` și `published_at`.
  --
  -- Apărarea de aici nu e RLS, ci dreptul de scriere dat pe coloane. Se
  -- încearcă FIECARE coloană din catalog, cu `set coloana = coloana` — o
  -- scriere care nu schimbă valoarea, dar trece prin aceeași verificare de
  -- drept — și tot într-o sub-tranzacție anulată. Greșit într-o parte,
  -- clientul își schimbă domeniul sau își pornește singur un modul plătit;
  -- greșit în cealaltă, nu-și mai poate publica site-ul și panoul dă eroare.
  -- O coloană nouă e verificată fără ca cineva s-o fi trecut aici.
  -- --------------------------------------------------------------------------
  scriibile := '{}';
  for coloana in
    select a.attname from pg_attribute a
    where a.attrelid = 'public.sites'::regclass and a.attnum > 0 and not a.attisdropped
    order by a.attnum
  loop
    begin
      perform set_config('role', 'authenticated', true);
      perform set_config('request.jwt.claims',
        json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
      execute format('update public.sites set %I = %I where id = $1', coloana, coloana)
        using site_a;
      raise sqlstate 'V0RBK';
    exception
      when sqlstate 'V0RBK' then scriibile := scriibile || coloana;
      when others then null;
    end;
    perform set_config('role', 'postgres', true);
  end loop;

  return query select
    'Clientul scrie în sites doar unde are voie'::text,
    case when scriibile @> array['name', 'published_at']
          and array['name', 'published_at'] @> scriibile
      then 'OK' else 'PICAT' end::text,
    case
      when not (scriibile @> array['name', 'published_at']) then
        format('nu-și poate scrie %s — Setările ar da eroare la salvare sau la publicare',
          array_to_string(array(select x from unnest(array['name', 'published_at']) x
                                where not x = any(scriibile)), ', '))
      when not (array['name', 'published_at'] @> scriibile) then
        format('POATE SCRIE ȘI: %s',
          array_to_string(array(select x from unnest(scriibile) x
                                where x not in ('name', 'published_at')), ', '))
      else 'poate scrie name și published_at, nimic altceva'
    end::text;

  -- --------------------------------------------------------------------------
  -- 9. Un client nu poate provizona site-uri.
  --
  -- Se cere codul 42501 (`insufficient_privilege`), nu orice eroare: cu „orice
  -- eroare", un email greșit din argumente ar fi arătat tot ca o apărare care
  -- ține. Dacă apelul trece, sub-tranzacția se anulează: site-ul făcut dispare.
  -- --------------------------------------------------------------------------
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', user_a, 'role', 'authenticated')::text, true);
    perform public.creeaza_client('furat.example.com', 'Furat', 'nimeni@example.com');
    raise sqlstate 'V0RBK';
  exception
    when sqlstate 'V0RBK' then
      perform set_config('role', 'postgres', true);
      return query select
        'Un client nu poate provizona site-uri'::text,
        'PICAT'::text,
        'a putut chema creeaza_client (anulat, site-ul făcut n-a rămas)'::text;
    when insufficient_privilege then
      perform set_config('role', 'postgres', true);
      return query select
        'Un client nu poate provizona site-uri'::text,
        'OK'::text,
        'respins: ' || SQLERRM;
    when others then
      perform set_config('role', 'postgres', true);
      return query select
        'Un client nu poate provizona site-uri'::text,
        'NECONCLUDENT'::text,
        'respinsă din alt motiv decât lipsa dreptului: ' || SQLERRM;
  end;

  -- --------------------------------------------------------------------------
  -- 10. Nicio funcție `security definer` nu e chemabilă din browser.
  --
  -- O astfel de funcție rulează cu drepturile proprietarului bazei, ocolind
  -- RLS. Chemabilă cu cheia anon sau de un client conectat, face ce-i spune
  -- oricine. Se uită la TOATE funcțiile din catalog, prin `has_function_privilege`,
  -- care socotește și PUBLIC, și moștenirea prin roluri.
  --
  -- Două excepții, structurale, nu pe nume: funcțiile de declanșator (Postgres
  -- refuză apelul direct) și `current_site_id`, pe care o cheamă chiar
  -- politicile RLS sub rolul clientului.
  -- --------------------------------------------------------------------------
  select string_agg(format('%s (%s)', p.proname,
    concat_ws(', ', case when has_function_privilege('anon', p.oid, 'execute') then 'anon' end,
                    case when has_function_privilege('authenticated', p.oid, 'execute') then 'authenticated' end)),
    '; ' order by p.proname) into lista
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and p.prorettype <> 'trigger'::regtype
    and p.proname <> 'current_site_id'
    and (has_function_privilege('anon', p.oid, 'execute')
         or has_function_privilege('authenticated', p.oid, 'execute'));

  return query select
    'Nicio funcție security definer nu e chemabilă din browser'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('chemabile: ' || lista, 'niciuna, în afara celor hotărâte')::text;

  -- --------------------------------------------------------------------------
  -- 11. Depozitul de fișiere: TOATE bucket-urile sunt private.
  --
  -- `/object/public/…` se uită DOAR la steagul `public` al bucket-ului; nicio
  -- politică nu-l poate opri. Deci steagul e verificarea. Se iau toate din
  -- catalog: unul nou, făcut public din tabloul de bord, e prins aici.
  -- --------------------------------------------------------------------------
  select string_agg(b.id, ', ' order by b.id) into lista from storage.buckets b where b.public;

  return query select
    'Depozitul de fișiere e privat'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('bucket-uri PUBLICE, citibile de oricine le știe adresa: ' || lista,
             format('toate cele %s bucket-uri au public = false',
                    (select count(*) from storage.buckets)))::text;

  -- --------------------------------------------------------------------------
  -- 12. Un vizitator nu poate nici lista, nici atinge fișierele nimănui.
  --
  -- Listarea (`/object/list/…`) trece prin politici. ORICE politică pe
  -- `storage.objects` care îl prinde pe `anon` — la citire, scriere, orice — e
  -- o ușă către fișierele tuturor cabinetelor.
  -- --------------------------------------------------------------------------
  select string_agg(format('%s (%s)', policyname, cmd), ', ' order by policyname) into lista
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and ('anon' = any(roles) or 'public' = any(roles));

  return query select
    'Un vizitator nu poate lista fișierele'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('politici pe storage.objects care îl prind pe anon: ' || lista,
             'nicio politică nu-l prinde pe anon')::text;

  -- --------------------------------------------------------------------------
  -- 13. Structura ține ce promite: constrângeri validate, declanșatori la locul
  --     lor, indecși pe `site_id`.
  --
  -- O cheie străină sau o verificare adăugată cu `not valid` și nevalidată
  -- niciodată apără doar rândurile noi. Un tabel cu `updated_at` fără
  -- declanșatorul de actualizare minte în panou. Un tabel cu `site_id` fără
  -- index e filtrat de RLS la fiecare cerere, pe toate rândurile tuturor
  -- clienților.
  -- --------------------------------------------------------------------------
  select string_agg(format('%s.%s', c.relname, k.conname), ', ' order by 1) into lista
  from pg_constraint k join pg_class c on c.oid = k.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and k.contype in ('f', 'c') and not k.convalidated;

  return query select
    'Toate constrângerile sunt validate'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('nevalidate, deci apără doar rândurile noi: ' || lista,
             'nicio constrângere lăsată nevalidată')::text;

  select string_agg(c.relname, ', ' order by c.relname) into lista
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attname = 'updated_at' and not a.attisdropped
  where n.nspname = 'public' and c.relkind = 'r'
    and not exists (
      select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
      where t.tgrelid = c.oid and not t.tgisinternal and p.proname = 'set_updated_at');

  return query select
    'Fiecare updated_at are declanșatorul lui'::text,
    case when lista is null then 'OK' else 'PICAT' end::text,
    coalesce('tabele cu updated_at care nu se actualizează singur: ' || lista,
             'toate tabelele cu updated_at îl țin la zi')::text;

  select string_agg(c.relname, ', ' order by c.relname) into lista
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attname = 'site_id' and not a.attisdropped
  where n.nspname = 'public' and c.relkind = 'r'
    and not exists (
      select 1 from pg_index x where x.indrelid = c.oid and x.indkey[0] = a.attnum);

  return query select
    'Fiecare site_id are un index'::text,
    case when lista is null then 'OK' else 'ATENȚIE' end::text,
    coalesce('tabele filtrate de RLS fără index pe site_id: ' || lista,
             'toate tabelele cu site_id au index care începe cu el')::text;

  -- --------------------------------------------------------------------------
  -- 14. Plasa de siguranță: n-a rămas nimic în urmă.
  --
  -- Aceleași numărători ca la început, plus rândul clientului de probă, citit
  -- din nou. Nu e curățenie, e dovada că verificarea poate fi rulată pe baza
  -- reală fără să lase urme — și e singura care ar prinde o probă viitoare
  -- scrisă fără sub-tranzacție.
  -- --------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  for tabel in select jsonb_object_keys(inainte) order by 1 loop
    execute format('select count(*) from %s', tabel) into randuri;
    dupa := dupa || jsonb_build_object(tabel, randuri);
  end loop;
  select to_jsonb(s) into rand_dupa from public.sites s where s.id = site_a;

  select string_agg(format('%s (%s → %s)', k, inainte -> k, dupa -> k), ', ' order by k) into lista
  from jsonb_object_keys(inainte) k where inainte -> k is distinct from dupa -> k;

  return query select
    'N-a rămas nimic în urmă'::text,
    case when lista is null and rand_inainte = rand_dupa then 'OK' else 'PICAT' end::text,
    case
      when lista is not null then 'tabele cu alt număr de rânduri decât la început: ' || lista
      when rand_inainte <> rand_dupa then 'rândul clientului de probă s-a schimbat'
      else format('%s tabele numărate înainte și după, la fel; rândul clientului, la fel',
                  (select count(*) from jsonb_object_keys(inainte)))
    end::text;
end;
$$;


-- (2) Toate cele trei zone, într-o singură interogare.
--
-- Fără tabel temporar, dinadins: SQL Editor din Supabase se uită la ce rulezi și
-- avertizează că se creează „o tabelă fără RLS, la care ar putea ajunge cheile
-- anon". Pentru o tabelă temporară asta nu e adevărat — trăiește doar în sesiunea
-- ta și dispare când închizi — dar un avertisment de securitate pe propria ta
-- unealtă de verificare e exact ce nu vrei să te obișnuiești să ignori.
with in_baza as (
select fel, cheie, coalesce(amprenta, '—') as amprenta from (
  -- Tabelele, cu starea RLS. Un tabel cu RLS stins e o scurgere, nu o
  -- diferență de stil, deci intră în amprentă lângă existența lui.
  select
    'tabel' as fel,
    format('public.%s', c.relname) as cheie,
    case when c.relrowsecurity then 'rls pornit' else 'RLS OPRIT' end as amprenta
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  union all
  -- Coloanele: tip, dacă acceptă gol, ce are implicit. Toate trei se pot
  -- schimba dintr-o migrare aplicată pe jumătate.
  select
    'coloana',
    format('public.%s.%s', c.relname, a.attname),
    concat_ws(' ',
      format_type(a.atttypid, a.atttypmod),
      case when a.attnotnull then 'not null' else 'poate fi gol' end,
      case when a.atthasdef then 'implicit ' || regexp_replace(
        (select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d
          where d.adrelid = c.oid and d.adnum = a.attnum), '\s+', ' ', 'g') end,
      case when a.attidentity <> '' then 'identitate' end,
      case when a.attgenerated <> '' then 'generată' end)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r'
    and a.attnum > 0 and not a.attisdropped
  union all
  -- Constrângerile. Aici stă `sites_template_check` — lista de șabloane pe care
  -- o migrare din 8 sept. a aplicat-o fără funcția care o însoțea.
  select
    'constrangere',
    format('public.%s.%s', c.relname, k.conname),
    regexp_replace(pg_get_constraintdef(k.oid), '\s+', ' ', 'g')
  from pg_constraint k
  join pg_class c on c.oid = k.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    -- Fără `not null`-urile din catalog (`contype = 'n'`), care în PostgreSQL 18
    -- devin rânduri în `pg_constraint` și pe 16 nu există. Le-ar fi văzut ca
    -- „ÎN PLUS ÎN BAZĂ", câte unul de fiecare coloană, în ziua în care Supabase
    -- trece pe 18. Nu se pierde nimic: `not null` e deja în amprenta coloanei.
    and k.contype in ('c', 'f', 'p', 'u', 'x')
  union all
  -- Indecșii care NU vin dintr-o constrângere; ceilalți sunt deja numărați mai
  -- sus, iar scriși de două ori ar arăta ca două diferențe pentru un lucru.
  -- Aici intră indexul unic pe programările vii, singurul loc în care „ocupat"
  -- chiar înseamnă ocupat.
  select
    'index',
    format('public.%s.%s', t.relname, i.relname),
    regexp_replace(pg_get_indexdef(x.indexrelid), '\s+', ' ', 'g')
  from pg_index x
  join pg_class i on i.oid = x.indexrelid
  join pg_class t on t.oid = x.indrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and not exists (select 1 from pg_constraint k where k.conindid = x.indexrelid)
  union all
  -- Politicile RLS, din `public` și din `storage` deopotrivă: izolarea pozelor
  -- e scrisă pe `storage.objects` de migrările noastre.
  select
    'politica',
    format('%s.%s.%s', n.nspname, c.relname, p.polname),
    concat_ws(' | ',
      case p.polcmd
        when 'r' then 'la citire' when 'a' then 'la adăugare'
        when 'w' then 'la modificare' when 'd' then 'la ștergere'
        else 'la tot' end,
      case when p.polpermissive then 'permisivă' else 'restrictivă' end,
      'roluri ' || coalesce((select string_agg(r.rolname, ',' order by r.rolname)
        from pg_roles r where r.oid = any (p.polroles)), 'toate'),
      'vede ' || coalesce(regexp_replace(pg_get_expr(p.polqual, p.polrelid), '\s+', ' ', 'g'), '—'),
      'scrie ' || coalesce(regexp_replace(pg_get_expr(p.polwithcheck, p.polrelid), '\s+', ' ', 'g'), '—'))
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public', 'storage')
  union all
  -- Funcțiile. Cuprinsul se compară printr-o amprentă scurtă a textului scris
  -- de noi: ce ne interesează e „e alta decât cea din migrare?", iar răspunsul
  -- se repară la fel oricum — rulând migrarea din nou.
  --
  -- `drepturi` nu e podoabă: `creeaza_client` are `revoke execute from public`,
  -- iar `inregistreaza_afisarea` e doar pentru `service_role`. Pierdute, oricine
  -- cu o sesiune de client ar putea chema provizionarea.
  select
    'functie',
    format('public.%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)),
    concat_ws(' | ',
      'cuprins ' || left(md5(regexp_replace(btrim(p.prosrc), '\s+', ' ', 'g')), 12),
      case when p.prosecdef then 'security definer' else 'security invoker' end,
      'drepturi ' || case when p.proacl is null then 'ORICINE POATE EXECUTA'
        else coalesce((select string_agg(
            case when split_part(acl::text, '=', 1) = '' then 'oricine'
              else split_part(acl::text, '=', 1) end
            || '=' || split_part(split_part(acl::text, '/', 1), '=', 2)
            || case when split_part(acl::text, '/', 2) <> pg_get_userbyid(p.proowner)
                 then '/DAT DE ' || split_part(acl::text, '/', 2) else '' end,
            ' ' order by split_part(acl::text, '=', 1))
          from unnest(p.proacl) acl
          where split_part(acl::text, '=', 1) in ('', 'anon', 'authenticated', 'service_role')),
          'nimeni din cei trei') end)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  union all
  -- Declanșatorii scriși de noi. Cei interni (ai cheilor străine) se sar: sunt
  -- deja acoperiți de constrângerea care i-a creat.
  select
    'declansator',
    format('public.%s.%s', c.relname, t.tgname),
    regexp_replace(pg_get_triggerdef(t.oid), '\s+', ' ', 'g')
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal
  union all
  -- Drepturile pe TABEL pentru cele trei roluri ale Supabase. Ale
  -- proprietarului bazei se sar: acolo diferă numele contului între baza de
  -- probă și cea reală, și n-ar spune nimic despre ce poate face un client.
  select
    'drept',
    format('public.%s', c.relname),
    coalesce((select string_agg(
        split_part(acl::text, '=', 1) || '=' ||
          regexp_replace(split_part(split_part(acl::text, '/', 1), '=', 2), 'm\*?', '', 'g')
          || case when split_part(acl::text, '/', 2) <> pg_get_userbyid(c.relowner)
               then '/DAT DE ' || split_part(acl::text, '/', 2) else '' end,
        ' ' order by split_part(acl::text, '=', 1))
      from unnest(coalesce(c.relacl, '{}'::aclitem[])) acl
      where split_part(acl::text, '=', 1) in ('anon', 'authenticated', 'service_role')),
      'niciun drept')
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  union all
  -- Drepturile pe COLOANĂ. Aici stă apărarea care ține domeniul și modulele
  -- plătite departe de client: pe `sites` clientul poate scrie doar `name` și
  -- `published_at`. E o apărare de alt fel decât RLS, deci trebuie privită
  -- separat — RLS-ul poate fi întreg în timp ce dreptul ăsta s-a lărgit.
  select
    'drept-coloana',
    format('public.%s.%s', c.relname, a.attname),
    -- Fără scoaterea lui `m` de la tabele: MAINTAIN e privilegiu de TABEL, nu de
    -- coloană (`ACL_ALL_RIGHTS_COLUMN` e același pe 16 și pe 17), deci n-are cum
    -- să apară aici. O normalizare care n-are ce normaliza doar minte cititorul.
    (select string_agg(split_part(acl::text, '/', 1)
        || case when split_part(acl::text, '/', 2) <> pg_get_userbyid(c.relowner)
             then '/DAT DE ' || split_part(acl::text, '/', 2) else '' end,
        ' ' order by split_part(acl::text, '=', 1))
      from unnest(a.attacl) acl
      where split_part(acl::text, '=', 1) in ('anon', 'authenticated', 'service_role'))
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r'
    and a.attnum > 0 and not a.attisdropped and a.attacl is not null
  union all
  -- Depozitele de fișiere. Nu e schemă, e un rând — dar e rândul de care atârnă
  -- dacă pozele tuturor cabinetelor se pot citi de oriunde, iar migrarea din
  -- 1 sept. exact asta a schimbat.
  select
    'depozit',
    format('storage.buckets.%s', b.id),
    case when b.public then 'PUBLIC — oricine citește' else 'privat' end
  from storage.buckets b
) amprenta
order by fel, cheie
),
asteptat (fel, cheie, amprenta, ultima_migrare) as (values
   ('coloana', 'public.appointments.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.appointments.email', 'text poate fi gol', '—')
,  ('coloana', 'public.appointments.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.appointments.name', 'text not null', '—')
,  ('coloana', 'public.appointments.notes', 'text poate fi gol', '—')
,  ('coloana', 'public.appointments.phone', 'text poate fi gol', '—')
,  ('coloana', 'public.appointments.service', 'text poate fi gol', '—')
,  ('coloana', 'public.appointments.site_id', 'uuid not null', '—')
,  ('coloana', 'public.appointments.starts_at', 'timestamp with time zone not null', '—')
,  ('coloana', 'public.appointments.status', 'text not null implicit ''ceruta''::text', '—')
,  ('coloana', 'public.audit_log.action', 'text not null', '—')
,  ('coloana', 'public.audit_log.actor_id', 'uuid poate fi gol', '—')
,  ('coloana', 'public.audit_log.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.audit_log.diff', 'jsonb poate fi gol', '—')
,  ('coloana', 'public.audit_log.entity_id', 'text poate fi gol', '—')
,  ('coloana', 'public.audit_log.entity_type', 'text not null', '—')
,  ('coloana', 'public.audit_log.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.audit_log.site_id', 'uuid not null', '—')
,  ('coloana', 'public.blog_articles.author_id', 'uuid poate fi gol', '—')
,  ('coloana', 'public.blog_articles.category_id', 'uuid poate fi gol', '—')
,  ('coloana', 'public.blog_articles.content', 'text not null implicit ''''::text', '—')
,  ('coloana', 'public.blog_articles.cover_alt', 'text poate fi gol', '—')
,  ('coloana', 'public.blog_articles.cover_upload_id', 'uuid poate fi gol', '—')
,  ('coloana', 'public.blog_articles.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.blog_articles.excerpt', 'text not null implicit ''''::text', '—')
,  ('coloana', 'public.blog_articles.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.blog_articles.published_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.blog_articles.seo', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.blog_articles.site_id', 'uuid not null', '—')
,  ('coloana', 'public.blog_articles.slug', 'text not null', '—')
,  ('coloana', 'public.blog_articles.status', 'text not null implicit ''draft''::text', '—')
,  ('coloana', 'public.blog_articles.title', 'text not null', '—')
,  ('coloana', 'public.blog_articles.updated_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.blog_categories.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.blog_categories.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.blog_categories.name', 'text not null', '—')
,  ('coloana', 'public.blog_categories.site_id', 'uuid not null', '—')
,  ('coloana', 'public.blog_categories.slug', 'text not null', '—')
,  ('coloana', 'public.contact_messages.consent', 'boolean not null implicit false', '—')
,  ('coloana', 'public.contact_messages.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.contact_messages.deleted_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.contact_messages.email', 'text poate fi gol', '—')
,  ('coloana', 'public.contact_messages.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.contact_messages.message', 'text poate fi gol', '—')
,  ('coloana', 'public.contact_messages.name', 'text not null', '—')
,  ('coloana', 'public.contact_messages.phone', 'text poate fi gol', '—')
,  ('coloana', 'public.contact_messages.read_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.contact_messages.site_id', 'uuid not null', '—')
,  ('coloana', 'public.newsletter_subscribers.confirmed_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.newsletter_subscribers.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.newsletter_subscribers.email', 'text not null', '—')
,  ('coloana', 'public.newsletter_subscribers.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.newsletter_subscribers.site_id', 'uuid not null', '—')
,  ('coloana', 'public.newsletter_subscribers.unsubscribed_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.page_views_daily.day', 'date not null', '—')
,  ('coloana', 'public.page_views_daily.path', 'text not null', '—')
,  ('coloana', 'public.page_views_daily.site_id', 'uuid not null', '—')
,  ('coloana', 'public.page_views_daily.views', 'integer not null implicit 0', '—')
,  ('coloana', 'public.pages.content', 'text not null implicit ''''::text', '—')
,  ('coloana', 'public.pages.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.pages.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.pages.nav_location', 'text not null implicit ''footer''::text', '—')
,  ('coloana', 'public.pages.position', 'integer not null implicit 0', '—')
,  ('coloana', 'public.pages.seo', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.pages.site_id', 'uuid not null', '—')
,  ('coloana', 'public.pages.slug', 'text not null', '—')
,  ('coloana', 'public.pages.status', 'text not null implicit ''draft''::text', '—')
,  ('coloana', 'public.pages.title', 'text not null', '—')
,  ('coloana', 'public.pages.updated_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.platform_owners.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.platform_owners.email', 'text poate fi gol', '—')
,  ('coloana', 'public.platform_owners.user_id', 'uuid not null', '—')
,  ('coloana', 'public.services.content', 'text not null implicit ''''::text', '—')
,  ('coloana', 'public.services.cover_upload_id', 'uuid poate fi gol', '—')
,  ('coloana', 'public.services.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.services.duration_label', 'text poate fi gol', '—')
,  ('coloana', 'public.services.excerpt', 'text not null implicit ''''::text', '—')
,  ('coloana', 'public.services.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.services.position', 'integer not null implicit 0', '—')
,  ('coloana', 'public.services.price_label', 'text poate fi gol', '—')
,  ('coloana', 'public.services.seo', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.services.site_id', 'uuid not null', '—')
,  ('coloana', 'public.services.slug', 'text not null', '—')
,  ('coloana', 'public.services.status', 'text not null implicit ''draft''::text', '—')
,  ('coloana', 'public.services.title', 'text not null', '—')
,  ('coloana', 'public.services.updated_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.services.visible', 'boolean not null implicit true', '—')
,  ('coloana', 'public.site_content.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.site_content.data', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_content.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.site_content.is_demo', 'boolean not null implicit false', '—')
,  ('coloana', 'public.site_content.key', 'text not null', '—')
,  ('coloana', 'public.site_content.position', 'integer not null implicit 0', '—')
,  ('coloana', 'public.site_content.site_id', 'uuid not null', '—')
,  ('coloana', 'public.site_content.tone', 'text not null implicit ''deschis''::text', '—')
,  ('coloana', 'public.site_content.updated_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.site_content.variant', 'text poate fi gol', '—')
,  ('coloana', 'public.site_content.visible', 'boolean not null implicit true', '—')
,  ('coloana', 'public.site_settings.analytics', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.brand', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.site_settings.pagini', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.programari', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.seo', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.site_id', 'uuid not null', '—')
,  ('coloana', 'public.site_settings.social', 'jsonb not null implicit ''{}''::jsonb', '—')
,  ('coloana', 'public.site_settings.updated_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.sites.appointments_enabled', 'boolean not null implicit false', '—')
,  ('coloana', 'public.sites.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.sites.domain', 'text not null', '—')
,  ('coloana', 'public.sites.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.sites.name', 'text not null', '—')
,  ('coloana', 'public.sites.published_at', 'timestamp with time zone poate fi gol', '—')
,  ('coloana', 'public.sites.template', 'text not null implicit ''caldura''::text', '—')
,  ('coloana', 'public.uploads.alt_text', 'text poate fi gol', '—')
,  ('coloana', 'public.uploads.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.uploads.filename', 'text not null', '—')
,  ('coloana', 'public.uploads.focal_x', 'smallint poate fi gol', '—')
,  ('coloana', 'public.uploads.focal_y', 'smallint poate fi gol', '—')
,  ('coloana', 'public.uploads.height', 'integer poate fi gol', '—')
,  ('coloana', 'public.uploads.id', 'uuid not null implicit gen_random_uuid()', '—')
,  ('coloana', 'public.uploads.mime_type', 'text not null', '—')
,  ('coloana', 'public.uploads.site_id', 'uuid not null', '—')
,  ('coloana', 'public.uploads.size_bytes', 'integer not null', '—')
,  ('coloana', 'public.uploads.storage_path', 'text not null', '—')
,  ('coloana', 'public.uploads.width', 'integer poate fi gol', '—')
,  ('coloana', 'public.users.created_at', 'timestamp with time zone not null implicit now()', '—')
,  ('coloana', 'public.users.email', 'text not null', '—')
,  ('coloana', 'public.users.id', 'uuid not null', '—')
,  ('coloana', 'public.users.site_id', 'uuid not null', '—')
,  ('constrangere', 'public.appointments.appointments_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.appointments.appointments_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.appointments.appointments_status_check', 'CHECK ((status = ANY (ARRAY[''ceruta''::text, ''confirmata''::text, ''refuzata''::text, ''anulata''::text])))', '20260827140000_programari.sql')
,  ('constrangere', 'public.audit_log.audit_log_action_check', 'CHECK ((action = ANY (ARRAY[''create''::text, ''update''::text, ''delete''::text, ''publish''::text, ''unpublish''::text, ''login''::text, ''logout''::text])))', '—')
,  ('constrangere', 'public.audit_log.audit_log_actor_id_fkey', 'FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL', '—')
,  ('constrangere', 'public.audit_log.audit_log_entity_type_check', 'CHECK ((entity_type = ANY (ARRAY[''Page''::text, ''Service''::text, ''Appointment''::text, ''BlogArticle''::text, ''BlogCategory''::text, ''SiteContent''::text, ''SiteSettings''::text, ''Upload''::text, ''ContactSubmission''::text, ''Session''::text])))', '—')
,  ('constrangere', 'public.audit_log.audit_log_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.audit_log.audit_log_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_author_id_fkey', 'FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_category_id_fkey', 'FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_cover_upload_id_fkey', 'FOREIGN KEY (cover_upload_id) REFERENCES uploads(id) ON DELETE SET NULL', '20260825120000_init_schema.sql')
,  ('constrangere', 'public.blog_articles.blog_articles_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_site_id_slug_key', 'UNIQUE (site_id, slug)', '—')
,  ('constrangere', 'public.blog_articles.blog_articles_status_check', 'CHECK ((status = ANY (ARRAY[''draft''::text, ''published''::text, ''unpublished''::text])))', '—')
,  ('constrangere', 'public.blog_categories.blog_categories_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.blog_categories.blog_categories_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.blog_categories.blog_categories_site_id_slug_key', 'UNIQUE (site_id, slug)', '—')
,  ('constrangere', 'public.contact_messages.contact_messages_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.contact_messages.contact_messages_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.newsletter_subscribers.newsletter_subscribers_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.newsletter_subscribers.newsletter_subscribers_site_id_email_key', 'UNIQUE (site_id, email)', '—')
,  ('constrangere', 'public.newsletter_subscribers.newsletter_subscribers_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.page_views_daily.page_views_daily_pkey', 'PRIMARY KEY (site_id, day, path)', '—')
,  ('constrangere', 'public.page_views_daily.page_views_daily_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.pages.pages_nav_location_check', 'CHECK ((nav_location = ANY (ARRAY[''header''::text, ''footer''::text, ''none''::text])))', '20260826220000_pagini_in_meniu.sql')
,  ('constrangere', 'public.pages.pages_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.pages.pages_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.pages.pages_site_id_slug_key', 'UNIQUE (site_id, slug)', '—')
,  ('constrangere', 'public.pages.pages_status_check', 'CHECK ((status = ANY (ARRAY[''draft''::text, ''published''::text, ''unpublished''::text])))', '—')
,  ('constrangere', 'public.platform_owners.platform_owners_pkey', 'PRIMARY KEY (user_id)', '—')
,  ('constrangere', 'public.platform_owners.platform_owners_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.services.services_cover_upload_id_fkey', 'FOREIGN KEY (cover_upload_id) REFERENCES uploads(id) ON DELETE SET NULL', '20260825120000_init_schema.sql')
,  ('constrangere', 'public.services.services_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.services.services_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.services.services_site_id_slug_key', 'UNIQUE (site_id, slug)', '—')
,  ('constrangere', 'public.services.services_status_check', 'CHECK ((status = ANY (ARRAY[''draft''::text, ''published''::text, ''unpublished''::text])))', '—')
,  ('constrangere', 'public.site_content.site_content_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.site_content.site_content_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.site_content.site_content_tone_check', 'CHECK ((tone = ANY (ARRAY[''deschis''::text, ''nuantat''::text, ''relief''::text, ''inchis''::text])))', '20260826110000_ton_relief.sql')
,  ('constrangere', 'public.site_settings.site_settings_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.site_settings.site_settings_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.site_settings.site_settings_site_id_key', 'UNIQUE (site_id)', '—')
,  ('constrangere', 'public.sites.sites_domain_key', 'UNIQUE (domain)', '—')
,  ('constrangere', 'public.sites.sites_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.sites.sites_template_check', 'CHECK ((template = ANY (ARRAY[''caldura''::text, ''liniste''::text, ''lumina''::text, ''apropiere''::text, ''claritate''::text])))', '20260908090000_sablonul_claritate.sql')
,  ('constrangere', 'public.uploads.uploads_focal_pereche_in_interval', 'CHECK ((((focal_x IS NULL) AND (focal_y IS NULL)) OR (((focal_x >= 0) AND (focal_x <= 100)) AND ((focal_y >= 0) AND (focal_y <= 100)))))', '20260911140000_pozitie_imagini.sql')
,  ('constrangere', 'public.uploads.uploads_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.uploads.uploads_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.users.users_id_fkey', 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE', '—')
,  ('constrangere', 'public.users.users_pkey', 'PRIMARY KEY (id)', '—')
,  ('constrangere', 'public.users.users_site_id_fkey', 'FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE', '—')
,  ('declansator', 'public.blog_articles.set_updated_at', 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.blog_articles FOR EACH ROW EXECUTE FUNCTION set_updated_at()', '20260827160000_sectiunea_programare.sql')
,  ('declansator', 'public.pages.set_updated_at', 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION set_updated_at()', '20260827160000_sectiunea_programare.sql')
,  ('declansator', 'public.services.set_updated_at', 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION set_updated_at()', '20260827160000_sectiunea_programare.sql')
,  ('declansator', 'public.site_content.set_updated_at', 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION set_updated_at()', '20260827160000_sectiunea_programare.sql')
,  ('declansator', 'public.site_settings.set_updated_at', 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at()', '20260827160000_sectiunea_programare.sql')
,  ('declansator', 'public.sites.adauga_sectiunea_programare', 'CREATE TRIGGER adauga_sectiunea_programare AFTER UPDATE OF appointments_enabled ON public.sites FOR EACH ROW EXECUTE FUNCTION adauga_sectiunea_programare()', '20260827160000_sectiunea_programare.sql')
,  ('depozit', 'storage.buckets.media', 'privat', '20260901090000_depozit_privat.sql')
,  ('drept', 'public.appointments', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.audit_log', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.blog_articles', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.blog_categories', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.contact_messages', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.newsletter_subscribers', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.page_views_daily', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.pages', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.platform_owners', 'service_role=arwdDxt', '—')
,  ('drept', 'public.services', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.site_content', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.site_settings', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.sites', 'anon=arwdDxt authenticated=ardDxt service_role=arwdDxt', '—')
,  ('drept', 'public.uploads', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept', 'public.users', 'anon=arwdDxt authenticated=arwdDxt service_role=arwdDxt', '—')
,  ('drept-coloana', 'public.sites.name', 'authenticated=w', '—')
,  ('drept-coloana', 'public.sites.published_at', 'authenticated=w', '—')
,  ('functie', 'public._cloneaza_tabel(p_tabel text, p_sursa uuid, p_overrides jsonb)', 'cuprins ab2172fadbb0 | security invoker | drepturi nimeni din cei trei', '20260911130000_cloneaza_site.sql')
,  ('functie', 'public.adauga_sectiunea_programare()', 'cuprins 934ddbb41d43 | security definer | drepturi oricine=X anon=X authenticated=X service_role=X', '20260827160000_sectiunea_programare.sql')
,  ('functie', 'public.cloneaza_site(p_sursa_domeniu text, p_tinta_domeniu text, p_tinta_nume text, p_tinta_email text, p_tinta_sablon text)', 'cuprins e12f1f919996 | security definer | drepturi service_role=X', '20260911130000_cloneaza_site.sql')
,  ('functie', 'public.creeaza_client(p_domeniu text, p_nume text, p_email text, p_sablon text, p_cu_programari boolean)', 'cuprins 19f3b7bace5a | security definer | drepturi service_role=X', '20260911130000_cloneaza_site.sql')
,  ('functie', 'public.current_site_id()', 'cuprins 9e5a0c2f19f2 | security definer | drepturi oricine=X anon=X authenticated=X service_role=X', '20260901090000_depozit_privat.sql')
,  ('functie', 'public.inregistreaza_afisarea(p_site_id uuid, p_zi date, p_cale text)', 'cuprins ebd86d2bfbca | security definer | drepturi service_role=X', '20260909100000_drepturi_de_executie.sql')
,  ('functie', 'public.set_updated_at()', 'cuprins 0ba6f773f96d | security invoker | drepturi oricine=X anon=X authenticated=X service_role=X', '20260827160000_sectiunea_programare.sql')
,  ('functie', 'public.textul_de_pornire(p_cheie text, p_nume text)', 'cuprins e6065fa56836 | security invoker | drepturi oricine=X anon=X authenticated=X service_role=X', '20260908170000_schelet_la_provizionare.sql')
,  ('index', 'public.appointments.appointments_ora_ocupata_idx', 'CREATE UNIQUE INDEX appointments_ora_ocupata_idx ON public.appointments USING btree (site_id, starts_at) WHERE (status = ANY (ARRAY[''ceruta''::text, ''confirmata''::text]))', '20260827140000_programari.sql')
,  ('index', 'public.appointments.appointments_site_id_idx', 'CREATE INDEX appointments_site_id_idx ON public.appointments USING btree (site_id)', '20260825120000_init_schema.sql')
,  ('index', 'public.appointments.appointments_site_starts_idx', 'CREATE INDEX appointments_site_starts_idx ON public.appointments USING btree (site_id, starts_at)', '20260827140000_programari.sql')
,  ('index', 'public.audit_log.audit_log_site_id_created_at_idx', 'CREATE INDEX audit_log_site_id_created_at_idx ON public.audit_log USING btree (site_id, created_at DESC)', '20260825120000_init_schema.sql')
,  ('index', 'public.contact_messages.contact_messages_site_id_idx', 'CREATE INDEX contact_messages_site_id_idx ON public.contact_messages USING btree (site_id)', '20260825120000_init_schema.sql')
,  ('index', 'public.newsletter_subscribers.newsletter_subscribers_site_id_idx', 'CREATE INDEX newsletter_subscribers_site_id_idx ON public.newsletter_subscribers USING btree (site_id)', '20260826090000_templates_and_sections.sql')
,  ('index', 'public.pages.pages_site_status_position_idx', 'CREATE INDEX pages_site_status_position_idx ON public.pages USING btree (site_id, status, "position")', '20260826220000_pagini_in_meniu.sql')
,  ('index', 'public.site_content.site_content_site_id_position_idx', 'CREATE INDEX site_content_site_id_position_idx ON public.site_content USING btree (site_id, "position")', '20260826130000_sectiuni_repetabile.sql')
,  ('index', 'public.uploads.uploads_site_id_idx', 'CREATE INDEX uploads_site_id_idx ON public.uploads USING btree (site_id)', '20260825120000_init_schema.sql')
,  ('index', 'public.users.users_site_id_idx', 'CREATE INDEX users_site_id_idx ON public.users USING btree (site_id)', '20260825120000_init_schema.sql')
,  ('politica', 'public.appointments.appointments: proprietarul site-ului citește/gestionează', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.audit_log.audit_log: proprietarul site-ului citește propriul jurnal', 'la citire | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie —', '20260825120000_init_schema.sql')
,  ('politica', 'public.audit_log.audit_log: proprietarul site-ului scrie în propriul jurnal', 'la adăugare | permisivă | roluri authenticated | vede — | scrie ((site_id = current_site_id()) AND ((actor_id IS NULL) OR (actor_id = auth.uid())))', '20260825140000_harden_rls.sql')
,  ('politica', 'public.blog_articles.blog_articles: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.blog_categories.blog_categories: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.contact_messages.contact_messages: proprietarul site-ului citește/gestionează', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.newsletter_subscribers.newsletter_subscribers: proprietarul site-ului gestionează', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260826090000_templates_and_sections.sql')
,  ('politica', 'public.page_views_daily.page_views_daily: proprietarul își vede propriile cifre', 'la citire | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie —', '20260827100000_vizite.sql')
,  ('politica', 'public.pages.pages: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.services.services: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.site_content.site_content: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.site_settings.site_settings: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.sites.sites: userul autentificat își poate actualiza propriul site', 'la modificare | permisivă | roluri authenticated | vede (id = current_site_id()) | scrie (id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.sites.sites: userul își vede propriul site', 'la citire | permisivă | roluri authenticated | vede (id = current_site_id()) | scrie —', '20260825140000_harden_rls.sql')
,  ('politica', 'public.uploads.uploads: CRUD propriul site', 'la tot | permisivă | roluri authenticated | vede (site_id = current_site_id()) | scrie (site_id = current_site_id())', '20260825120000_init_schema.sql')
,  ('politica', 'public.users.users: userul își vede propriul rând', 'la citire | permisivă | roluri authenticated | vede (id = auth.uid()) | scrie —', '20260825120000_init_schema.sql')
,  ('politica', 'storage.objects.media: proprietarul site-ului actualizează propriul folder', 'la modificare | permisivă | roluri authenticated | vede ((bucket_id = ''media''::text) AND ((storage.foldername(name))[1] = (current_site_id())::text)) | scrie —', '20260825120000_init_schema.sql')
,  ('politica', 'storage.objects.media: proprietarul site-ului citește din propriul folder', 'la citire | permisivă | roluri authenticated | vede ((bucket_id = ''media''::text) AND ((storage.foldername(name))[1] = (current_site_id())::text)) | scrie —', '20260901090000_depozit_privat.sql')
,  ('politica', 'storage.objects.media: proprietarul site-ului încarcă în propriul folder', 'la adăugare | permisivă | roluri authenticated | vede — | scrie ((bucket_id = ''media''::text) AND ((storage.foldername(name))[1] = (current_site_id())::text))', '20260825120000_init_schema.sql')
,  ('politica', 'storage.objects.media: proprietarul site-ului șterge din propriul folder', 'la ștergere | permisivă | roluri authenticated | vede ((bucket_id = ''media''::text) AND ((storage.foldername(name))[1] = (current_site_id())::text)) | scrie —', '20260825120000_init_schema.sql')
,  ('tabel', 'public.appointments', 'rls pornit', '—')
,  ('tabel', 'public.audit_log', 'rls pornit', '—')
,  ('tabel', 'public.blog_articles', 'rls pornit', '—')
,  ('tabel', 'public.blog_categories', 'rls pornit', '—')
,  ('tabel', 'public.contact_messages', 'rls pornit', '—')
,  ('tabel', 'public.newsletter_subscribers', 'rls pornit', '—')
,  ('tabel', 'public.page_views_daily', 'rls pornit', '—')
,  ('tabel', 'public.pages', 'rls pornit', '—')
,  ('tabel', 'public.platform_owners', 'rls pornit', '—')
,  ('tabel', 'public.services', 'rls pornit', '—')
,  ('tabel', 'public.site_content', 'rls pornit', '—')
,  ('tabel', 'public.site_settings', 'rls pornit', '—')
,  ('tabel', 'public.sites', 'rls pornit', '—')
,  ('tabel', 'public.uploads', 'rls pornit', '—')
,  ('tabel', 'public.users', 'rls pornit', '—')
),
diferente as (
  select
    case
      when b.cheie is null then 'LIPSEȘTE DIN BAZĂ'
      when a.cheie is null then 'ÎN PLUS ÎN BAZĂ'
      else 'ALTFEL ÎN BAZĂ'
    end as problema,
    coalesce(a.fel, b.fel) as fel,
    coalesce(a.cheie, b.cheie) as cheie,
    coalesce(a.amprenta, '—') as ar_trebui,
    coalesce(b.amprenta, '—') as este,
    coalesce(a.ultima_migrare, '—') as migrarea
  from asteptat a
  full outer join in_baza b on b.fel = a.fel and b.cheie = a.cheie
  where a.amprenta is distinct from b.amprenta
)
select * from (

select 'comportament' as zona, verificare, verdict, detaliu
from pg_temp.verifica_izolarea()

union all

select 'formă', d.fel || ' · ' || d.cheie, d.problema,
  'ar trebui: ' || d.ar_trebui || '   |   în bază: ' || d.este
    || case when d.migrarea = '—' then '' else '   |   ' || d.migrarea end
from diferente d

union all

select 'formă', 'toate cele 259 de lucruri din schemă', 'OK',
  'baza reală are exact ce scriu migrările'
where not exists (select 1 from diferente)

union all

-- (3) Datele. Nimic din ce urmează nu e oprit de vreo constrângere, dar fiecare
--     strică ceva pe care clientul îl vede — sau nu-l vede, ceea ce e mai rău.
select 'date', v.ce,
  case when v.cate = 0 then 'OK' else 'ATENȚIE' end,
  case when v.cate = 0 then v.bine else v.cate || ': ' || left(v.care, 200) end
from (
  select 'Fiecare site are un cont de login' as ce, count(*) as cate,
    'niciun site fără cont' as bine,
    coalesce(string_agg(s.domain, ', ' order by s.domain), '') as care
  from public.sites s
  where not exists (select 1 from public.users u where u.site_id = s.id)

  union all
  select 'Fiecare site are rândul lui de setări', count(*),
    'niciunul fără setări',
    coalesce(string_agg(s.domain, ', ' order by s.domain), '')
  from public.sites s
  where not exists (select 1 from public.site_settings t where t.site_id = s.id)

  union all
  select 'Nicio pagină pe o adresă a platformei', count(*),
    'niciuna — altfel n-ar citi-o nimeni',
    coalesce(string_agg(s.domain || '/' || p.slug, ', ' order by s.domain), '')
  from public.pages p join public.sites s on s.id = p.site_id
  where p.slug in ('admin', 'api', 'blog', 'dashboard', 'favicon.ico', 'imagini', 'login', 'nepublicat', 'opengraph-image', 'programare', 'proba-vanzari', 'proprietar', 'robots.txt', 'servicii', 'site-unavailable', 'sitemap.xml')

  union all
  select 'Fișierele stau în dosarul cabinetului lor', count(*),
    'toate căile încep cu site_id',
    coalesce(string_agg(u.storage_path, ', ' order by u.storage_path), '')
  from public.uploads u
  where u.storage_path not like u.site_id::text || '/%'

  union all
  select 'Niciun fișier rămas fără rândul lui', count(*),
    'depozitul și tabelul spun la fel',
    coalesce(string_agg(o.name, ', ' order by o.name), '')
  from storage.objects o
  where o.bucket_id = 'media'
    and not exists (select 1 from public.uploads u where u.storage_path = o.name)

  union all
  select 'Niciun site publicat fără vreo secțiune vizibilă', count(*),
    'fiecare site publicat arată ceva',
    coalesce(string_agg(s.domain, ', ' order by s.domain), '')
  from public.sites s
  where s.published_at is not null
    and not exists (select 1 from public.site_content c
                     where c.site_id = s.id and c.visible)

  union all
  select 'Niciun conținut de probă vizibil pe un site publicat', count(*),
    'niciunul',
    coalesce(string_agg(s.domain || ' · ' || c.key, ', ' order by s.domain), '')
  from public.site_content c join public.sites s on s.id = c.site_id
  where c.is_demo and c.visible and s.published_at is not null

  union all
  select 'Programările pornite au și secțiunea lor', count(*),
    'fiecare cabinet cu modulul pornit o are',
    coalesce(string_agg(s.domain, ', ' order by s.domain), '')
  from public.sites s
  where s.appointments_enabled
    and not exists (select 1 from public.site_content c
                     where c.site_id = s.id and c.key = 'programare')

  union all
  select 'Fiecare secțiune are o cheie pe care site-ul o știe randa', count(*),
    'toate cheile sunt în registru',
    coalesce(string_agg(s.domain || ' · ' || c.key, ', ' order by s.domain), '')
  from public.site_content c join public.sites s on s.id = c.site_id
  where c.key not in ('aboutTeaser', 'contact', 'faq', 'features', 'hero', 'howItWorks', 'latestPosts', 'logos', 'newsletter', 'portfolio', 'pricing', 'programare', 'quote', 'testimonials')

  union all
  select 'Nicio poză din secțiuni nu arată spre un fișier inexistent', count(*),
    'fiecare uploadId din secțiuni are rândul lui în uploads',
    coalesce(string_agg(distinct s.domain || ' · ' || c.key, ', '), '')
  from public.site_content c
  join public.sites s on s.id = c.site_id,
  lateral jsonb_path_query(c.data, '$.**.uploadId') as ref(v)
  where jsonb_typeof(ref.v) = 'string'
    and not exists (select 1 from public.uploads u where u.id::text = (ref.v #>> '{}'))

  union all
  select 'Fiecare fișier din tabel există și în depozit', count(*),
    'niciun rând din uploads fără fișierul lui',
    coalesce(string_agg(u.storage_path, ', ' order by u.storage_path), '')
  from public.uploads u
  where not exists (select 1 from storage.objects o
                     where o.bucket_id = 'media' and o.name = u.storage_path)

  union all
  select 'Domeniile sunt scrise curat', count(*),
    'litere mici, fără https://, fără bară, fără spații',
    coalesce(string_agg(s.domain, ', ' order by s.domain), '')
  from public.sites s
  where s.domain <> lower(s.domain) or s.domain ~ '^[a-z]+://' or s.domain ~ '[/\s]'
     or s.domain ~ '\.$' or s.domain ~ '^\.'

  union all
  select 'Niciun domeniu scris de două ori, cu alte litere', count(*),
    'niciunul',
    coalesce(string_agg(d.domenii, '; '), '')
  from (select string_agg(s.domain, ' / ') as domenii
          from public.sites s group by lower(s.domain) having count(*) > 1) d

  union all
  select 'Nicio secțiune vizibilă și goală pe un site publicat', count(*),
    'niciuna — vizitatorul nu vede benzi goale',
    coalesce(string_agg(s.domain || ' · ' || c.key, ', ' order by s.domain), '')
  from public.site_content c join public.sites s on s.id = c.site_id
  where s.published_at is not null and c.visible and c.data = '{}'::jsonb
    -- „programare" se randează din programul de lucru, nu din data:  e
    -- starea ei normală, pusă de declanșator când se pornește modulul.
    and c.key <> 'programare'

  union all
  select 'Fiecare site publicat are politica de confidențialitate publicată', count(*),
    'toate — legea o cere înainte de a strânge date prin formulare',
    coalesce(string_agg(s.domain, ', ' order by s.domain), '')
  from public.sites s
  where s.published_at is not null
    and not exists (select 1 from public.pages p
                     where p.site_id = s.id and p.slug = 'politica-de-confidentialitate'
                       and p.status = 'published')

  union all
  select 'Conturile de login sunt legate de un site', count(*),
    'toate conturile au site',
    coalesce(string_agg(a.email, ', ' order by a.email), '')
  from auth.users a
  where not exists (select 1 from public.users u where u.id = a.id)
) v

) tot
-- Ce nu e OK vine primul, în fiecare zonă.
order by
  case zona when 'comportament' then 1 when 'formă' then 2 else 3 end,
  case when verdict = 'OK' then 2 else 1 end,
  verificare;
