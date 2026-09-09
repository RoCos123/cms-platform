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
  -- --------------------------------------------------------------------------
  select string_agg(c.relname, ', ' order by c.relname) into lista
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'sites'
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

select * from pg_temp.verifica_izolarea();
