#!/usr/bin/env bash
#
# Bancul de probă: un Postgres gol, migrările noastre peste el, doi clienți
# seedați, verificarea de izolare rulată.
#
# De ce există: migrările și scripturile SQL au ajuns de două ori la client
# netestate, fiindcă mediul de dezvoltare nu ajunge la Supabase. Postgres se
# instalează local în câteva secunde — nu era niciun motiv să ghicim.
#
# Ce NU e: o copie a Supabase. Sunt împrumutate doar bucățile de care depind
# migrările — `auth.uid()`, tabelele din `storage` și, important, drepturile de
# tabel pe care Supabase le acordă din start rolurilor `anon`/`authenticated`.
# Fără ele, orice interogare pică local cu „permission denied", adică din alt
# motiv decât în producție, iar verificarea ar trece degeaba.
#
#   Rulare:  bash supabase/proba-locala.sh
#   Cere:    postgresql (psql + initdb), rulat cu drept de a folosi `runuser`.

set -euo pipefail

RADACINA="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
BAZA="${PGPROBA_DIR:-/var/lib/postgresql/proba}"
SOCK="$BAZA/sock"

echo "→ pornesc un Postgres gol în $BAZA"
"$BIN/pg_ctl" -D "$BAZA/data" stop -m immediate >/dev/null 2>&1 || true
rm -rf "$BAZA"; mkdir -p "$BAZA/data" "$BAZA/sock"; chown -R postgres:postgres "$BAZA"
runuser -u postgres -- "$BIN/initdb" -D "$BAZA/data" -U postgres --auth=trust >/dev/null
runuser -u postgres -- "$BIN/pg_ctl" -D "$BAZA/data" \
  -o "-k $SOCK -c listen_addresses=''" -l "$BAZA/pg.log" start >/dev/null
sleep 2

ruleaza() { psql -h "$SOCK" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "→ pun bucățile de Supabase de care depind migrările"
ruleaza <<'SQL'
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema auth;
create schema storage;
grant usage on schema public, auth, storage to anon, authenticated, service_role;

create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);

create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id), name text not null, owner uuid
);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/') $$;
SQL

# Drepturile de tabel se acordă la CREAREA fiecărui tabel, nu după migrări.
#
# Aici era o greșeală care a ținut bancul orb luni de zile: un
# `grant all on all tables` rulat DUPĂ migrări ștergea orice `revoke` scris
# într-o migrare. Adică exact apărarea care blochează coloanele pe care
# clientul n-are voie să scrie — `sites.domain`, și acum modulele plătite — era
# invizibilă aici: verificarea trecea în producție și pica local, sau invers.
#
# Supabase nu re-acordă nimic după migrările tale; dă drepturile prin
# `alter default privileges`, la crearea tabelului. Asta face și linia de mai
# jos, iar un `revoke` dintr-o migrare rămâne în picioare, ca acolo.
ruleaza -c "alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;"

# ȘI PE FUNCȚII. Aceeași lecție ca mai sus, în al doilea loc — găsit pe 9 sept. 2026,
# la prima rulare a verificării de schemă pe baza reală: acolo funcțiile aveau
# `anon=X authenticated=X service_role=X`, aici niciunul. Adică `revoke execute ...
# from public` din migrări părea o apărare, fiindcă pe banc nu exista niciun grant
# explicit pe care să-l lase în picioare.
ruleaza -c "alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;"
ruleaza -c "alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;"

echo "→ rulez migrările, în ordine"
for m in "$RADACINA"/supabase/migrations/*.sql; do
  printf "   %-52s" "$(basename "$m")"
  ruleaza -f "$m" && echo "ok"
done

# ---------------------------------------------------------------------------
# A prins declarația de mai sus?
#
# Dacă nu, bancul redevine orb exact pe felul de apărare care ne-a scăpat pe
# 9 sept.: verificările 6 și 11 ar trece iar din motivul greșit, iar nimic n-ar
# spune-o. `alter default privileges` se leagă de rolul care o scrie și de schemă
# — destule feluri de a deveni tăcut inertă la o schimbare de mediu.
#
# Se uită la un obiect ADEVĂRAT, creat de migrări, nu la declarație: doar așa se
# știe că a și fost aplicată, nu doar scrisă.
# ---------------------------------------------------------------------------
echo "→ verific că bancul chiar a primit drepturile implicite ale Supabase"
FIDEL="$(ruleaza -tAc "select coalesce(array_to_string(proacl, ' '), '') like '%anon=X%'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'current_site_id'")"

if [ "$FIDEL" != "t" ]; then
  echo
  echo "BANCUL E INFIDEL: funcțiile din public n-au primit granturile explicite pe"
  echo "care Supabase le dă prin 'alter default privileges'. Fără ele, un"
  echo "'revoke ... from public' pare o apărare și nu e — vezi CONVENTII.md,"
  echo "§„Ce se revocă de la PUBLIC nu e revocat de la roluri\"."
  exit 1
fi
echo "   drepturile implicite pe funcții: puse"
echo

echo "→ seedez doi clienți, cu câte un rând în fiecare tabel"
ruleaza <<'SQL'
do $$
declare s uuid; u uuid; i int; nume text; dom text;
begin
  for i in 1..2 loop
    nume := 'Cabinet de probă ' || i;
    dom  := 'proba' || i || '.ro';
    insert into public.sites (name, domain) values (nume, dom) returning id into s;
    insert into auth.users (email) values ('owner' || i || '@exemplu.ro') returning id into u;
    insert into public.users (id, site_id, email) values (u, s, 'owner' || i || '@exemplu.ro');
    insert into public.site_content (site_id, key, position, data) values (s, 'hero', 10, jsonb_build_object('titlu', nume));
    update public.sites set appointments_enabled = true where id = s and i = 1;
    insert into public.site_settings (site_id, brand) values (s, jsonb_build_object('telefon', '0722'));
    insert into public.pages (site_id, slug, title, content, status) values (s, 'tarife', 'Tarife', 'Text.', 'published');
    insert into public.services (site_id, slug, title, excerpt, status) values (s, 'consiliere', 'Consiliere', 'Pe scurt.', 'published');
    insert into public.blog_categories (site_id, name, slug) values (s, 'Anxietate', 'anxietate');
    insert into public.blog_articles (site_id, slug, title, excerpt, content, status, author_id)
      values (s, 'primul', 'Primul articol', 'Extras.', 'Text.', 'published', u);
    insert into public.uploads (site_id, storage_path, filename, mime_type, size_bytes) values (s, s || '/poza.png', 'poza.png', 'image/png', 1000);
    insert into public.contact_messages (site_id, name, email, message) values (s, 'Vizitator', 'v@exemplu.ro', 'Bună ziua.');
    insert into public.appointments (site_id, name, email, starts_at, status) values (s, 'Vizitator', 'v@exemplu.ro', now(), 'ceruta');
    insert into public.audit_log (site_id, actor_id, action, entity_type) values (s, u, 'update', 'SiteContent');
    insert into public.page_views_daily (site_id, day, path, views) values (s, current_date, '/', 3);
  end loop;
end;
$$;
SQL

echo
echo "→ provizionez un client cu creeaza_client, ca la un client real"
ruleaza <<'SQL'
insert into auth.users (email) values ('proba3@exemplu.ro');
select public.creeaza_client('proba3.ro', 'Cabinet de probă 3', 'proba3@exemplu.ro', 'liniste', true);
SQL

psql -h "$SOCK" -U postgres -d postgres <<'SQL'
-- Ce trebuie să iasă dintr-o singură linie. Numerele sunt scrise aici dinadins:
-- dacă cineva scoate o secțiune din funcție fără să vrea, se vede la rulare.
select
  s.domain,
  s.template,
  (select count(*) from public.site_content c where c.site_id = s.id) as sectiuni,
  (select count(*) from public.site_content c where c.site_id = s.id and c.visible) as vizibile,
  (select count(*) from public.users u where u.site_id = s.id) as conturi,
  (select count(*) from public.site_settings t where t.site_id = s.id) as setari,
  (select string_agg(p.slug || ':' || p.status, ', ') from public.pages p where p.site_id = s.id) as pagini
from public.sites s where s.domain = 'proba3.ro';
SQL

echo "→ verificarea de izolare"
psql -h "$SOCK" -U postgres -d postgres -f "$RADACINA/supabase/verificare-izolare.sql" | tail -n +2

# ----------------------------------------------------------------------------
# Verdictul, citit de mașină, nu cu ochiul.
#
# Până acum scriptul doar TIPĂREA tabelul de mai sus și ieșea cu 0, chiar dacă o
# verificare dădea PICAT. Adică bancul se sprijinea pe cineva care se uită atent
# la douăsprezece rânduri — ceea ce merge când rulezi o dată și nu merge deloc
# într-un CI, unde nimeni nu se uită dacă scrie „verde".
#
# `NECONCLUDENT` cade la fel ca `PICAT`, dinadins: o verificare care n-a putut
# decide nu e o verificare trecută. Chiar aici s-a întâmplat o dată — a zecea
# verificare trecea fiindcă rula cu rolul greșit, nu fiindcă apărarea ținea.
# ----------------------------------------------------------------------------
RELE=$(psql -h "$SOCK" -U postgres -d postgres -qtA \
  -f "$RADACINA/supabase/verificare-izolare.sql" \
  | awk -F'|' 'NF >= 3 && $2 != "OK" { print "   ✗ " $1 " → " $2 " (" $3 ")" }')

if [ -n "$RELE" ]; then
  echo
  echo "VERIFICĂRI PICATE:"
  echo "$RELE"
  echo
  echo "Baza rămâne pornită, ca să te poți uita:"
  echo "  psql -h $SOCK -U postgres -d postgres"
  exit 1
fi

# ---------------------------------------------------------------------------
# Amprenta schemei, rescrisă din baza pe care tocmai am construit-o.
#
# Stă AICI, nu într-un pas de sine stătător, fiindcă cere baza pornită și
# fiindcă orice migrare nouă trece oricum pe banc întâi. Așa, fișierul de
# verificat baza reală nu poate rămâne în urma migrărilor fără ca cineva să vadă
# o schimbare neașteptată în `git status`.
# ---------------------------------------------------------------------------
echo
PGPROBA_SOCK="$SOCK" bash "$RADACINA/supabase/genereaza-verificare-schema.sh"

echo
echo "Toate verificările de izolare au trecut."
echo
echo "Baza rămâne pornită. Te conectezi cu:"
echo "  psql -h $SOCK -U postgres -d postgres"
echo "O oprești cu:"
echo "  runuser -u postgres -- $BIN/pg_ctl -D $BAZA/data stop"
