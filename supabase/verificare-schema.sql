-- ============================================================================
-- Verificare: baza reală are exact ce scriu migrările noastre?
--
-- GENERAT — nu se scrie de mână. Iese din
-- `supabase/genereaza-verificare-schema.sh`, care ia amprenta bazei de probă
-- (toate migrările, în ordine, pe un Postgres gol) și o lipește aici ca listă.
-- Interogarea o compară cu ce găsește în baza în care o rulezi.
--
-- CUM SE RULEAZĂ
--   Supabase → SQL Editor → New query → lipești TOT fișierul → Run.
--   Ai grijă să NU ai text selectat: cu o selecție se rulează doar ea. Exact
--   așa a intrat pe jumătate migrarea din 8 sept. 2026 — constrângerea s-a
--   aplicat, funcția nu.
--
-- CE SCRIE ÎNAPOI
--   „TOTUL E LA FEL" pe un singur rând, sau câte un rând per diferență:
--     LIPSEȘTE DIN BAZĂ  — migrarea care îl creează n-a rulat, sau a rulat pe
--                          jumătate. Ăsta e cazul care ne-a mușcat deja.
--     ALTFEL ÎN BAZĂ     — există, dar spune altceva. La funcții înseamnă de
--                          obicei o versiune mai veche, rămasă de la o migrare
--                          care n-a fost rulată din nou.
--     ÎN PLUS ÎN BAZĂ    — există în bază, dar nicio migrare nu-l creează.
--                          De obicei ceva făcut de mână din tabloul de bord.
--
-- NU MODIFICĂ NIMIC din date sau din schemă. Singura scriere e `search_path`-ul
-- sesiunii, de mai jos, fără de care textele recompuse de Postgres s-ar putea
-- scrie altfel aici decât pe bancul de pe care s-a luat amprenta.
--
-- DE ȘTIUT: amprenta așteptată e luată pe PostgreSQL 16. O parte din ea
-- (constrângeri, indecși, politici) e text pe care Postgres îl recompune
-- singur și îl poate scrie altfel pe altă versiune majoră. Dacă baza reală e pe
-- altă versiune, câteva rânduri „ALTFEL ÎN BAZĂ" pot fi doar asta — se vede din
-- coloanele alăturate, care arată amândouă textele. Rândurile „LIPSEȘTE" și „ÎN
-- PLUS" nu au ambiguitatea asta.
--
-- 259 lucruri verificate: tabele, coloane, constrângeri, indecși, politici
-- RLS, funcții (cu drepturile lor de execuție), declanșatori, drepturi pe tabel
-- și pe coloană, și steagul de public al depozitului de fișiere.
-- ============================================================================
set search_path = public;

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

-- Amprenta bazei de probă: migrările noastre, aplicate întregi, în ordine.
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

-- Diferențele. `is distinct from`, nu `<>`: cu `<>` un rând lipsă dintr-o parte
-- ar da NULL, iar NULL nu trece de `where` — adică tocmai lipsurile, care sunt
-- cazul important, ar fi rămas nespuse.
diferente as (
  select
    case
      when b.cheie is null then '1 · LIPSEȘTE DIN BAZĂ'
      when a.cheie is null then '3 · ÎN PLUS ÎN BAZĂ'
      else '2 · ALTFEL ÎN BAZĂ'
    end as problema,
    coalesce(a.fel, b.fel) as fel,
    coalesce(a.cheie, b.cheie) as cheie,
    coalesce(a.amprenta, '—') as ar_trebui,
    coalesce(b.amprenta, '—') as este_in_baza,
    coalesce(a.ultima_migrare, '—') as ultima_migrare
  from asteptat a
  full outer join in_baza b on b.fel = a.fel and b.cheie = a.cheie
  where a.amprenta is distinct from b.amprenta
)

-- Rândul de la urmă există fiindcă un tabel gol nu spune dacă verificarea a
-- trecut sau dacă n-a rulat.
select * from diferente
union all
select 'TOTUL E LA FEL', '—', 'baza reală are exact ce scriu migrările', '—', '—', '—'
where not exists (select 1 from diferente)
order by problema, fel, cheie;
