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
ruleaza -c "alter default privileges in schema public grant all on tables to anon, authenticated, service_role;"

echo "→ rulez migrările, în ordine"
for m in "$RADACINA"/supabase/migrations/*.sql; do
  printf "   %-52s" "$(basename "$m")"
  ruleaza -f "$m" && echo "ok"
done

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
echo "→ verificarea de izolare"
psql -h "$SOCK" -U postgres -d postgres -f "$RADACINA/supabase/verificare-izolare.sql" | tail -n +2

echo
echo "Baza rămâne pornită. Te conectezi cu:"
echo "  psql -h $SOCK -U postgres -d postgres"
echo "O oprești cu:"
echo "  runuser -u postgres -- $BIN/pg_ctl -D $BAZA/data stop"
