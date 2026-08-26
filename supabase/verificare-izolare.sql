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
  vazute int;
  al_lui uuid;
  randuri bigint;
  tabel text;
  scurgeri text := '';
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
  -- Fiecare client, logat, vede DOAR conținutul lui.
  --
  -- Interogare fără niciun filtru pe site_id: dacă politicile ar fi greșite,
  -- ar întoarce rândurile amândurora.
  -- --------------------------------------------------------------------------
  foreach al_lui in array array[user_a, user_b] loop
    perform set_config('role', 'authenticated', true);
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', al_lui, 'role', 'authenticated')::text,
      true
    );

    select count(distinct c.site_id) into vazute from public.site_content c;

    perform set_config('role', 'postgres', true);
    perform set_config('request.jwt.claims', '', true);

    return query select
      format('Clientul %s vede doar conținutul lui', left(al_lui::text, 8))::text,
      case when vazute = 1 then 'OK' else 'PICAT' end::text,
      case
        when vazute = 1 then 'un singur site, al lui'
        when vazute = 0 then 'nu vede nimic — are secțiuni seedate?'
        else format('vede %s site-uri — SCURGERE ÎNTRE CLIENȚI', vazute)
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
    'appointments', 'audit_log'
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

  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

select * from pg_temp.verifica_izolarea();
