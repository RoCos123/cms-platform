/**
 * Scrie SQL-ul care toarnă conținutul site-ului de vânzări în baza reală.
 *
 * Se generează, nu se scrie de mână: sursa e `src/app/proba-vanzari/continut.ts`,
 * adică EXACT textele din care s-a randat previzualizarea. Scris în paralel, în
 * două locuri, SQL-ul ar fi ajuns să se contrazică cu ce a aprobat proprietarul
 * — iar diferența s-ar fi văzut abia pe site.
 *
 *   node --import ./e2e/alias.mjs scripts/sql-vanzari.mjs <domeniu> > fisier.sql
 */
import { SECTIUNI, SERVICII } from "@/app/proba-vanzari/continut";

const domeniu = process.argv[2];
if (!domeniu) {
  console.error("Lipsește domeniul. Ex.: node ... scripts/sql-vanzari.mjs sitepsihologi.vercel.app");
  process.exit(1);
}

/** Un șir, gata de pus în SQL. Apostrofurile se dublează, ca peste tot în SQL. */
const sir = (v) => `'${String(v).replaceAll("'", "''")}'`;
const json = (v) => `${sir(JSON.stringify(v))}::jsonb`;

const randuri = [];
const p = (s) => randuri.push(s);

p("-- ============================================================================");
p(`-- Conținutul site-ului de vânzări, turnat în ${domeniu}.`);
p("--");
p("-- GENERAT, nu scris de mână: `node --import ./e2e/alias.mjs scripts/sql-vanzari.mjs`,");
p("-- din `src/app/proba-vanzari/continut.ts` — aceleași texte din care s-a randat");
p("-- previzualizarea. Deci site-ul iese identic cu ce s-a aprobat.");
p("--");
p("-- Se poate rula de câte ori vrei: șterge serviciile puse tot de el și rescrie");
p("-- secțiunile. Ce a scris clientul de mână între timp SE PIERDE — de-aia se");
p("-- rulează la început, pe un site gol, nu peste unul la care s-a lucrat.");
p("-- ============================================================================");
p("");
p("do $$");
p("declare");
p("  v_site uuid;");
p("begin");
p(`  select id into v_site from public.sites where domain = ${sir(domeniu)};`);
p(`  if v_site is null then`);
p(`    raise exception 'Nu există niciun site pe domeniul %. Verifică adresa.', ${sir(domeniu)};`);
p("  end if;");
p("");
p("  -- 1. Serviciile — de acolo își ia „Ce primești” cele șase căsuțe.");
p("  delete from public.services where site_id = v_site;");
SERVICII.forEach((s, i) => {
  p("  insert into public.services (site_id, slug, title, excerpt, content, status, visible, position)");
  p(`  values (v_site, ${sir(s.slug)}, ${sir(s.titlu)}, ${sir(s.descriereScurta)}, ${sir(s.descriereCompleta ?? "")}, 'published', true, ${(i + 1) * 10});`);
});
p("");
p("  -- 2. Secțiunile folosite: conținut, ton, ordine, așezare.");
p("  --    `is_demo = false`: textele astea sunt ale noastre dinadins, nu ciornă");
p("  --    de înlocuit, deci n-au ce căuta în numărătoarea de pe ecranul de acasă.");
SECTIUNI.forEach((s, i) => {
  p("  update public.site_content set");
  p(`    data = ${json(s.data)},`);
  p(`    tone = ${sir(s.tone)},`);
  p(`    variant = ${s.variant ? sir(s.variant) : "null"},`);
  p(`    position = ${(i + 1) * 10},`);
  p("    visible = true,");
  p("    is_demo = false");
  p(`  where site_id = v_site and key = ${sir(s.key)};`);
});
p("");
p("  -- 3. Restul secțiunilor se sting: pe un site care vinde un produs n-au ce");
p("  --    căuta „Despre mine”, banda cu citat sau newsletterul.");
const folosite = [...new Set(SECTIUNI.map((s) => s.key))];
p(`  update public.site_content set visible = false`);
p(`  where site_id = v_site and key not in (${folosite.map(sir).join(", ")});`);
p("end $$;");
p("");
p("-- Verificare: ce se vede acum, în ordine.");
p("select position, key, variant, visible, data->>'titlu' as titlu");
p(`from public.site_content`);
p(`where site_id = (select id from public.sites where domain = ${sir(domeniu)})`);
p("order by visible desc, position;");

console.log(randuri.join("\n"));
