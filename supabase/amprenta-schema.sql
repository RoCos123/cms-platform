-- ============================================================================
-- AMPRENTA SCHEMEI: ce ar trebui să conțină baza, scris ca rânduri.
--
-- Un singur `select`, care întoarce `(fel, cheie, amprenta)` — câte un rând
-- pentru fiecare lucru pe care îl construiesc migrările noastre: tabel,
-- coloană, constrângere, index, politică, funcție, declanșator, drept, depozit.
--
-- DE CE E UN SINGUR FIȘIER, folosit în DOUĂ locuri. Amprenta se ia o dată pe
-- baza de probă (care are toate migrările aplicate, în ordine, pe un Postgres
-- gol) și o dată pe baza reală din Supabase. Dacă interogările ar fi scrise
-- separat, cele două părți ar putea devia una de alta — adică exact greșeala pe
-- care verificarea trebuie s-o prindă. Aici e definiția; `verificare-schema.sql`
-- e generat din ea, cu `genereaza-verificare-schema.sh`.
--
-- CERE `search_path = public`, pus de fișierul generat înainte de interogare.
-- Peste două sute din rânduri conțin text pe care Postgres îl recompune singur,
-- iar el scrie numele calificat sau nu DUPĂ search_path-ul sesiunii:
-- `current_site_id()` cu `public` în cale, `public.current_site_id()` fără. La
-- prima rulare pe baza reală s-a potrivit din noroc — amândouă părțile aveau
-- `public` în cale. Pus pe față, norocul nu mai e nevoie.
--
-- CE NU CUPRINDE, dinadins: tot ce nu e al nostru. Doar schema `public`, plus
-- politicile și depozitele din `storage` scrise de migrările noastre.
-- Extensiile, rolurile și tabelele interne ale Supabase rămân pe dinafară — o
-- verificare care se plânge în fiecare zi de lucruri străine ajunge să nu mai
-- fie citită.
--
-- CE E ALES CA SĂ ȚINĂ PESTE VERSIUNI DE POSTGRES. Cuprinsul funcțiilor se
-- compară pe `prosrc` — textul scris de noi, păstrat cuvânt cu cuvânt — nu pe
-- `pg_get_functiondef`, pe care Postgres îl recompune singur și îl poate scrie
-- altfel de la o versiune la alta. Unde nu se poate altfel (constrângeri,
-- indecși, politici), textul se normalizează la spații simple.
--
-- CINE A DAT DREPTUL se scrie doar când NU e proprietarul obiectului. Nu e
-- amănunt: `REVOKE` scoate numai granturile date de rolul care revocă, iar unul
-- dat de altcineva rămâne pe loc, cu o simplă avertizare, nu cu o eroare. Pe
-- 9 sept. o migrare de revocare a „reușit" fără să schimbe nimic, iar amprenta
-- n-a putut arăta de ce, fiindcă tăia partea de după `/`. Când acordantul E
-- proprietarul — cazul obișnuit — nu se scrie nimic, ca să nu facă zgomot.
--
-- DOUĂ NORMALIZĂRI, amândouă din prima rulare pe baza reală (9 sept. 2026), care
-- e pe altă versiune majoră decât bancul:
--
--   * `m` se scoate din drepturile pe tabel și pe coloană. E MAINTAIN, privilegiu
--     apărut în PostgreSQL 17 și cuprins în `grant all`. Pe 16 nu există. Fără
--     scoaterea lui, TOATE tabelele ieșeau „diferite" la fiecare rulare, pentru
--     ceva ce nu e al nostru și nu spune nimic — iar o verificare care se plânge
--     mereu ajunge să nu mai fie citită.
--
--   * cuprinsul funcțiilor se normalizează la spații simple înainte de amprentă.
--     Textul ajunge în baza reală prin copiere într-un editor din browser, care
--     poate schimba sfârșiturile de rând. Fără normalizare, o funcție identică
--     ieșea „altfel în bază". Prețul, scris ca să nu fie uitat: o diferență
--     făcută DOAR din spații dinăuntrul unui șir de caractere nu se mai vede.
-- ============================================================================

-- `coalesce` pe amprentă nu e pedanterie: partea generată trece prin text, unde
-- NULL ajunge șir gol, iar baza reală ar întoarce tot NULL. Cele două ar fi
-- „diferite" la nesfârșit, pentru un lucru care e la fel.
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
