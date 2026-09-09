#!/usr/bin/env bash
#
# Scrie `supabase/verificare-schema.sql` din baza de probă.
#
# Fișierul generat e o singură interogare de lipit în SQL Editor din Supabase.
# Înăuntru are DOUĂ amprente: una scrisă aici, luată de pe baza de probă (toate
# migrările, în ordine, pe un Postgres gol), și una pe care o calculează el
# însuși, pe baza reală, cu ACELAȘI `select` din `amprenta-schema.sql`. Le pune
# față în față și tipărește doar ce diferă.
#
# DE CE AȘA, și nu un script care se conectează la Supabase de aici: mediul de
# dezvoltare nu ajunge la baza reală, și nici nu vrem să ajungă — ar însemna un
# șir de conectare cu parolă ținut undeva. Amprenta așteptată e o listă de
# valori, deci poate călători prin fișier. Comparația se mută în baza reală.
#
# CÂND SE RULEAZĂ: singur, la coada lui `proba-locala.sh`. Adică la fiecare
# migrare nouă, fiindcă orice migrare trece pe banc întâi.
#
#   Rulare:  bash supabase/genereaza-verificare-schema.sh
#   Cere:    baza de probă pornită (o pornește `proba-locala.sh`).

set -euo pipefail

RADACINA="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOCK="${PGPROBA_SOCK:-/var/lib/postgresql/proba/sock}"
IESIRE="$RADACINA/supabase/verificare-schema.sql"
LUCRU="$(mktemp -d)"
trap 'rm -rf "$LUCRU"' EXIT

# `search_path` pus pe față, fiindcă de el atârnă cum scrie Postgres textele pe
# care le recompune singur (constrângeri, indecși, politici) — calificat sau nu.
# Aceeași valoare o pune fișierul generat înainte de interogare, ca cele două
# părți să nu se compare scrise altfel.
interoga() {
  PGOPTIONS='-c search_path=public' \
    psql -h "$SOCK" -U postgres -d postgres -v ON_ERROR_STOP=1 -qtA "$@"
}

if ! interoga -c 'select 1' >/dev/null 2>&1; then
  echo "Baza de probă nu răspunde la $SOCK." >&2
  echo "Pornește-o întâi:  bash supabase/proba-locala.sh" >&2
  exit 1
fi

# Versiunea majoră se scrie în fișier fiindcă o parte din amprentă (constrângeri,
# indecși, politici) e text pe care Postgres îl recompune singur, și îl poate
# scrie altfel de la o versiune majoră la alta. Fără nota asta, o verificare
# picată pe o versiune diferită ar arăta ca o bază stricată.
MAJOR="$(interoga -c "select current_setting('server_version_num')::int / 10000")"

# Tab ca despărțitor, nu `|`: amprentele funcțiilor și ale politicilor conțin
# chiar ` | ` înăuntru.
interoga -F$'\t' -f "$RADACINA/supabase/amprenta-schema.sql" > "$LUCRU/amprenta.tsv"
RANDURI="$(wc -l < "$LUCRU/amprenta.tsv" | tr -d ' ')"

# --------------------------------------------------------------------------
# „Din ce migrare vine lucrul ăsta" — ca ultimă coloană în tabelul de
# diferențe, ca să nu fie nevoie de căutat prin depozit când ceva lipsește.
#
# E o POMENIRE, nu o dovadă, și așa se și cheamă coloana: ultimul fișier care
# scrie numele. Pentru un lucru redefinit de mai multe ori (o funcție cu
# `create or replace`, o constrângere refăcută) ultimul e chiar cel de rulat.
#
# Doar pentru numele distinctive. Tabelele, coloanele și drepturile se cheamă
# `sites`, `name`, `status` — nume pomenite de aproape fiecare migrare, deci
# „ultimul fișier care le scrie" ar arăta mereu spre cea mai nouă, indiferent de
# unde vine lucrul. Un indiciu care minte e mai rău decât niciunul.
# --------------------------------------------------------------------------
awk -F'\t' '$1 ~ /^(constrangere|index|politica|functie|declansator|depozit)$/ {
  n = split($2, bucati, ".");
  nume = bucati[n];
  sub(/\(.*/, "", nume);          # `creeaza_client(p_domeniu text, …)` → `creeaza_client`
  if (length(nume) > 3) print nume;
}' "$LUCRU/amprenta.tsv" | sort -u > "$LUCRU/nume.txt"

: > "$LUCRU/harta.tsv"
for m in "$RADACINA"/supabase/migrations/*.sql; do
  grep -oFf "$LUCRU/nume.txt" "$m" 2>/dev/null | sort -u \
    | awk -v f="$(basename "$m")" '{ print $0 "\t" f }' >> "$LUCRU/harta.tsv" || true
done

# --------------------------------------------------------------------------
# Fișierul. Fără dată înăuntru, dinadins: altfel s-ar schimba la fiecare
# regenerare, iar CI-ul n-ar mai putea deosebi „migrare nouă, fișier uitat" de
# „l-am rulat din nou".
# Valorile așteptate se scriu O DATĂ și se folosesc în AMÂNDOUĂ fișierele de mai
# jos. Scrise de două ori, cele două verificări ar fi putut ajunge să spună
# lucruri diferite despre aceeași bază.
awk -F'\t' -v harta="$LUCRU/harta.tsv" '
BEGIN {
  while ((getline linie < harta) > 0) {
    split(linie, h, "\t");
    unde[h[1]] = h[2];            # fișierele vin în ordine, deci ultimul rămâne
  }
}
function sql(s) { gsub(/'\''/, "'\'''\''", s); return "'\''" s "'\''"; }
{
  n = split($2, bucati, ".");
  nume = bucati[n]; sub(/\(.*/, "", nume);
  m = ($1 ~ /^(constrangere|index|politica|functie|declansator|depozit)$/ && (nume in unde)) ? unde[nume] : "—";
  printf "%s  (%s, %s, %s, %s)\n", (NR == 1 ? " " : ","), sql($1), sql($2), sql($3), sql(m);
}' "$LUCRU/amprenta.tsv" > "$LUCRU/valori.sql"

# --------------------------------------------------------------------------
{
cat <<CAP
-- ============================================================================
-- Verificare: baza reală are exact ce scriu migrările noastre?
--
-- GENERAT — nu se scrie de mână. Iese din
-- \`supabase/genereaza-verificare-schema.sh\`, care ia amprenta bazei de probă
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
-- DE ȘTIUT: amprenta așteptată e luată pe PostgreSQL $MAJOR. O parte din ea
-- (constrângeri, indecși, politici) e text pe care Postgres îl recompune
-- singur și îl poate scrie altfel pe altă versiune majoră. Dacă baza reală e pe
-- altă versiune, câteva rânduri „ALTFEL ÎN BAZĂ" pot fi doar asta — se vede din
-- coloanele alăturate, care arată amândouă textele. Rândurile „LIPSEȘTE" și „ÎN
-- PLUS" nu au ambiguitatea asta.
--
-- $RANDURI lucruri verificate: tabele, coloane, constrângeri, indecși, politici
-- RLS, funcții (cu drepturile lor de execuție), declanșatori, drepturi pe tabel
-- și pe coloană, și steagul de public al depozitului de fișiere.
-- ============================================================================
CAP

echo "set search_path = public;"
echo ""
echo "with in_baza as ("

cat "$RADACINA/supabase/amprenta-schema.sql" | sed '/^--/d; /^$/d'

echo "),"
echo ""
echo "-- Amprenta bazei de probă: migrările noastre, aplicate întregi, în ordine."
echo "asteptat (fel, cheie, amprenta, ultima_migrare) as (values"

cat "$LUCRU/valori.sql"

cat <<'COADA'
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
COADA
} > "$IESIRE"

echo "→ scris $IESIRE ($RANDURI lucruri, amprentă luată pe PostgreSQL $MAJOR)"

# ============================================================================
# Al doilea fișier: verificarea AMĂNUNȚITĂ.
#
# Cel de mai sus se uită doar la FORMĂ, și e cel de rulat după o migrare. Ăsta
# adaugă două lucruri pe care forma nu le poate spune:
#
#   COMPORTAMENT — chiar încearcă să vadă datele altui client, să scrie ca
#     vizitator anonim, să cheme funcțiile platformei. Verificarea de izolare
#     n-a mai rulat pe baza reală din 26 aug. 2026, iar între timp au apărut
#     provizionarea, programările, depozitul privat și comutatorul de lansare.
#
#   DATE — lucruri pe care nicio schemă nu le poate opri, dar care strică
#     site-ul unui client: un site fără cont de login, o pagină pe o adresă
#     rezervată (n-o citește nimeni), un fișier cu calea în afara cabinetului.
#
# Amândouă fișierele pleacă din ACEEAȘI amprentă, scrisă o singură dată mai sus.
# ============================================================================
COMPLET="$RADACINA/supabase/verificare-completa.sql"

# Adresele rezervate se scot din cod, nu se scriu aici: o a doua listă ar fi
# exact felul de lucru care rămâne în urmă fără ca nimeni să bage de seamă.
REZERVATE="$(sed -n '/ADRESE_REZERVATE = \[/,/\] as const;/p' "$RADACINA/src/lib/pagini.ts" \
  | grep -o '"[^"]*"' | tr '"' "'" | paste -sd, - | sed 's/,/, /g')"

{
cat <<CAP
-- ============================================================================
-- Verificarea amănunțită: formă, comportament și date.
--
-- GENERAT din \`supabase/genereaza-verificare-schema.sh\`. Nu se scrie de mână.
--
-- CUM SE RULEAZĂ
--   Supabase → SQL Editor → New query → tot fișierul → Run, FĂRĂ text selectat.
--   Scrie un singur tabel, cu o linie per verificare.
--
-- CE ÎNSEAMNĂ COLOANA \`zona\`
--   comportament — chiar se încearcă: un client care caută datele altuia, un
--                  vizitator anonim care scrie, o funcție a platformei chemată
--                  de cine nu trebuie. Astea nu se pot deduce din schemă.
--   formă        — cele $RANDURI de lucruri din schemă, față de migrări.
--   date         — ce nu poate opri nicio schemă, dar strică site-ul cuiva.
--
-- CE SCHIMBĂ. Aproape nimic, și nimic ce rămâne: \`search_path\`-ul sesiunii, o
-- funcție temporară care dispare la închidere, și o singură scriere care TREBUIE
-- respinsă — dacă totuși trece, rândul se șterge pe loc și verificarea dă PICAT.
--
-- CU UN SINGUR CLIENT în bază, comparațiile între clienți se sar și scriu „NU SE
-- POATE"; restul rulează. Un tabel gol ar fi fost mai rău: se citește ușor drept
-- „e bine".
-- ============================================================================

set search_path = public;
CAP

echo ""
echo "-- (1) Verificarea de comportament, adusă întreagă din verificare-izolare.sql."
sed '/^select \* from pg_temp\.verifica_izolarea();$/d' "$RADACINA/supabase/verificare-izolare.sql"

cat <<'MIJLOC'

-- (2) Toate cele trei zone, într-o singură interogare.
--
-- Fără tabel temporar, dinadins: SQL Editor din Supabase se uită la ce rulezi și
-- avertizează că se creează „o tabelă fără RLS, la care ar putea ajunge cheile
-- anon". Pentru o tabelă temporară asta nu e adevărat — trăiește doar în sesiunea
-- ta și dispare când închizi — dar un avertisment de securitate pe propria ta
-- unealtă de verificare e exact ce nu vrei să te obișnuiești să ignori.
with in_baza as (
MIJLOC

sed '/^--/d; /^$/d' "$RADACINA/supabase/amprenta-schema.sql"

echo "),"
echo "asteptat (fel, cheie, amprenta, ultima_migrare) as (values"
cat "$LUCRU/valori.sql"

cat <<'MIJLOC2'
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
MIJLOC2

cat <<COADA1

union all

select 'formă', 'toate cele $RANDURI de lucruri din schemă', 'OK',
  'baza reală are exact ce scriu migrările'
where not exists (select 1 from diferente)
COADA1

cat <<COADA2

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
  where p.slug in ($REZERVATE)

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
) v

) tot
COADA2

cat <<'COADA3'
-- Ce nu e OK vine primul, în fiecare zonă.
order by
  case zona when 'comportament' then 1 when 'formă' then 2 else 3 end,
  case when verdict = 'OK' then 2 else 1 end,
  verificare;
COADA3
} > "$COMPLET"

echo "→ scris $COMPLET (comportament + formă + date)"

