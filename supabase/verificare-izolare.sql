-- ============================================================================
-- Verificare: datele unui client nu ajung niciodată la alt client.
--
-- E aceeași verificare pe care o face `e2e/tenant-rls.spec.ts`, dar rescrisă
-- ca să poată fi rulată direct în SQL Editor din Supabase — fără terminal,
-- fără Node, fără variabile de mediu.
--
-- CUM SE RULEAZĂ
--   Supabase → SQL Editor → New query → lipești TOT fișierul → Run.
--   Rezultatul e un tabel cu o linie per verificare și verdictul ei.
--
--   „Fără date la alt client" nu e o eroare și nici o slăbiciune a bazei: e un
--   tabel în care NIMENI altcineva n-are rânduri, deci nu există ce să scape.
--   Ca acoperirea să fie completă, măcar unul dintre clienții de test ar trebui
--   să aibă un rând în fiecare tabel.
--
-- NU MODIFICĂ NIMIC. Singura scriere pe care o încearcă e una care TREBUIE să
-- fie respinsă; dacă totuși trece, rândul se șterge imediat și verificarea e
-- marcată PICAT.
--
-- Are nevoie de CEL PUȚIN DOI clienți în tabelul `sites`, fiecare cu userul
-- lui. Cu unul singur n-are ce compara și ți-o spune, în loc să treacă degeaba.
-- ============================================================================

create or replace function pg_temp.verifica_izolarea()
returns table (verificare text, verdict text, detaliu text)
language plpgsql
as $$
declare
  user_a uuid; site_a uuid;
  user_b uuid; site_b uuid;
  al_lui uuid; site_lui uuid;
  randuri bigint; straine bigint;
  dovedite int; fara_ce int; refuzate int;
  ale_altora bigint;
  tabel text; coloana text;
  scurgeri text := '';
  netestate text := '';
  refuzuri text := '';
begin
  -- --------------------------------------------------------------------------
  -- Doi useri din site-uri diferite. Fără ei, restul n-ar dovedi nimic.
  -- --------------------------------------------------------------------------
  select u.id, u.site_id into user_a, site_a
  from public.users u order by u.site_id, u.id limit 1;

  select u.id, u.site_id into user_b, site_b
  from public.users u where u.site_id <> site_a order by u.site_id, u.id limit 1;

  if user_a is null or user_b is null then
    return query select
      'Doi clienți de comparat'::text,
      'NU SE POATE'::text,
      'Ai nevoie de cel puțin două site-uri, fiecare cu userul lui. Vezi supabase/seed-test-tenants.sql.'::text;
    return;
  end if;

  return query select 'Doi clienți de comparat'::text, 'OK'::text,
    format('%s și %s', site_a, site_b);

  -- --------------------------------------------------------------------------
  -- Fiecare client, logat, vede DOAR datele lui — în TOATE tabelele.
  --
  -- Interogări fără niciun filtru: dacă o politică ar fi greșită, rândurile
  -- celuilalt client ar ieși la iveală.
  --
  -- Un tabel gol pentru clientul de test nu e o eroare, dar nici nu dovedește
  -- nimic — de asta îl numărăm separat, în loc să-l trecem drept „OK".
  -- --------------------------------------------------------------------------
  for i in 1..2 loop
    al_lui   := case when i = 1 then user_a else user_b end;
    site_lui := case when i = 1 then site_a else site_b end;
    dovedite := 0;
    fara_ce := 0;
    refuzate := 0;
    scurgeri := '';
    netestate := '';
    refuzuri := '';

    foreach tabel in array array[
      'sites', 'users', 'site_content', 'site_settings', 'pages', 'services',
      'blog_categories', 'blog_articles', 'uploads', 'contact_messages',
      'appointments', 'audit_log', 'page_views_daily'
    ] loop
      -- În `sites`, clientul E rândul; în rest, îl arată coloana `site_id`.
      coloana := case when tabel = 'sites' then 'id' else 'site_id' end;

      -- Câte rânduri ale ALTOR clienți există în tabel, văzute cu ochii bazei
      -- (rolul curent e încă cel privilegiat la momentul apelului de mai jos).
      --
      -- Ăsta e numărul care hotărăște dacă verificarea dovedește ceva. Un tabel
      -- gol la clientul nostru NU e „nedovedit", dacă altcineva are rânduri
      -- acolo: tocmai faptul că nu le vede e dovada. Nedovedit e doar tabelul în
      -- care nimeni altcineva n-are nimic — acolo n-are ce să scape.
      execute format(
        'select count(*) from public.%I where %I is distinct from $1', tabel, coloana
      ) into ale_altora using site_lui;

      begin
        perform set_config('role', 'authenticated', true);
        perform set_config(
          'request.jwt.claims',
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
        -- ATENȚIE: aici refuzul NU e un răspuns bun.
        --
        -- Prima variantă a verificării îl număra ca reușită, „n-are voie nici să
        -- întrebe" — și așa a trecut o politică stricată dinadins, fără să o
        -- prindă. Un client care nu-și poate citi PROPRIILE date n-are izolare
        -- bună; are panoul rupt. Se raportează separat.
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
  -- Un vizitator anonim nu poate citi nimic cu cheia publică.
  --
  -- Cheia publishable stă în codul fiecărui site, deci oricine o poate lua.
  -- După migrarea de întărire, rolul `anon` n-are voie la niciun tabel de date.
  -- --------------------------------------------------------------------------
  perform set_config('role', 'anon', true);

  foreach tabel in array array[
    'sites', 'users', 'site_content', 'site_settings', 'pages', 'services',
    'blog_categories', 'blog_articles', 'uploads', 'contact_messages',
    'appointments', 'audit_log', 'page_views_daily'
  ] loop
    begin
      execute format('select count(*) from public.%I', tabel) into randuri;
      if randuri > 0 then
        scurgeri := scurgeri || tabel || ' (' || randuri || ' rânduri), ';
      end if;
    exception when others then
      -- Refuzul e răspunsul bun: înseamnă că nici măcar n-are voie să întrebe.
      null;
    end;
  end loop;

  perform set_config('role', 'postgres', true);

  return query select
    'Un vizitator anonim nu poate citi date'::text,
    case when scurgeri = '' then 'OK' else 'PICAT' end::text,
    case when scurgeri = '' then 'niciun tabel nu întoarce rânduri'
         else 'citește din: ' || rtrim(scurgeri, ', ') end::text;

  -- --------------------------------------------------------------------------
  -- Un vizitator anonim nu poate scrie în inboxul nimănui.
  --
  -- Inserarea anonimă era `with check (true)`: oricine putea fabrica mesaje în
  -- contul oricărui client. Formularele publice trec acum prin server, care
  -- pune el `site_id`-ul.
  -- --------------------------------------------------------------------------
  perform set_config('role', 'anon', true);

  begin
    insert into public.contact_messages (site_id, name, email, message)
    values (site_a, 'VERIFICARE-IZOLARE', 'verificare@exemplu.ro', 'Ar fi trebuit respins.');

    -- Am ajuns aici: inserarea a trecut, ceea ce e o problemă. Ștergem urma cu
    -- rolul privilegiat — `anon` n-are drept de ștergere, deci ar rămâne acolo.
    perform set_config('role', 'postgres', true);
    delete from public.contact_messages where name = 'VERIFICARE-IZOLARE';

    return query select
      'Un vizitator anonim nu poate trimite mesaje direct în bază'::text,
      'PICAT'::text,
      'inserarea a trecut — spam țintit posibil (rândul de test a fost șters)'::text;
  exception when others then
    perform set_config('role', 'postgres', true);
    return query select
      'Un vizitator anonim nu poate trimite mesaje direct în bază'::text,
      'OK'::text,
      'respins: ' || SQLERRM;
  end;

  -- --------------------------------------------------------------------------
  -- Un vizitator anonim nu poate umfla cifrele nimănui.
  --
  -- `inregistreaza_afisarea` e `security definer`, adică rulează cu drepturi
  -- depline peste un tabel care n-are nicio politică de scriere. Dacă dreptul
  -- de execuție ar ajunge la rolurile din browser, oricine deschide site-ul ar
  -- putea chema funcția într-o buclă și scrie ce cifre vrea în panoul
  -- clientului — sau, mai rău, în al altui client, dându-i alt `site_id`.
  -- --------------------------------------------------------------------------
  perform set_config('role', 'anon', true);

  begin
    perform public.inregistreaza_afisarea(site_a, current_date, '/verificare-izolare');

    perform set_config('role', 'postgres', true);
    delete from public.page_views_daily where path = '/verificare-izolare';

    return query select
      'Un vizitator anonim nu poate umfla cifrele de trafic'::text,
      'PICAT'::text,
      'a putut chema inregistreaza_afisarea (rândul de test a fost șters)'::text;
  exception when others then
    perform set_config('role', 'postgres', true);
    return query select
      'Un vizitator anonim nu poate umfla cifrele de trafic'::text,
      'OK'::text,
      'respins: ' || SQLERRM;
  end;

  -- --------------------------------------------------------------------------
  -- Un client nu-și poate porni singur un modul plătit.
  --
  -- Modulele stau în coloane pe `sites`, iar apărarea lor NU e o politică RLS
  -- scrisă de noi, ci dreptul de scriere dat pe coloane în migrarea de
  -- întărire: `grant update (name)`, nimic altceva. Verificarea asta există
  -- fiindcă e o apărare ușor de pierdut din greșeală — un `grant update on
  -- public.sites` scris cândva, ca să meargă altceva, ar deschide-o în tăcere,
  -- iar Programările ar deveni gratuite pentru oricine se pricepe puțin.
  -- --------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', (select id from public.users where site_id = site_a limit 1))::text,
    true
  );

  -- Domeniul: aceeași apărare, o miză mai mare. Dacă un client și-ar putea
  -- schimba domeniul, și-ar muta site-ul pe orice adresă neocupată — iar dacă
  -- unicitatea ar cădea vreodată, pe a altcuiva. CONTEXT.md spune de mult că
  -- „domeniul e blocat prin grant"; până acum nu se putea dovedi, fiindcă
  -- bancul local ștergea granturile pe coloane după migrări.
  begin
    update public.sites set domain = 'furat-de-client.ro' where id = site_a;

    perform set_config('role', 'postgres', true);
    update public.sites set domain = 'client-a.ro' where id = site_a;

    return query select
      'Un client nu-și poate schimba singur domeniul'::text,
      'PICAT'::text,
      'și-a mutat site-ul pe alt domeniu (pus la loc)'::text;
  exception when others then
    return query select
      'Un client nu-și poate schimba singur domeniul'::text,
      'OK'::text,
      'respins: ' || SQLERRM;
  end;

  -- Numele, în schimb, TREBUIE să se poată salva: e singura coloană din `sites`
  -- pe care clientul o editează, din Setări. O apărare care blochează și asta
  -- ar strica ecranul, nu l-ar apăra.
  begin
    update public.sites set name = 'Verificare izolare' where id = site_a;

    return query select
      'Clientul își poate salva numele cabinetului'::text,
      'OK'::text,
      'coloana name rămâne scriibilă, cum trebuie'::text;
  exception when others then
    return query select
      'Clientul își poate salva numele cabinetului'::text,
      'PICAT'::text,
      'apărarea a mers prea departe: ' || SQLERRM;
  end;

  begin
    update public.sites set appointments_enabled = true where id = site_a;

    perform set_config('role', 'postgres', true);
    update public.sites set appointments_enabled = false where id = site_a;

    return query select
      'Un client nu-și poate porni singur un modul plătit'::text,
      'PICAT'::text,
      'și-a pornit singur Programările (pus la loc pe oprit)'::text;
  exception when others then
    perform set_config('role', 'postgres', true);
    return query select
      'Un client nu-și poate porni singur un modul plătit'::text,
      'OK'::text,
      'respins: ' || SQLERRM;
  end;

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

select * from pg_temp.verifica_izolarea();
