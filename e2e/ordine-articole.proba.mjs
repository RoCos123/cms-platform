import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mutaArticol, mutaInLista, pozitiaArticoluluiNou } from "@/lib/ordine-articole";

/**
 * Ordinea articolelor de blog, mutată din meniul „⋯" al listei. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026: „să apeși pe 3 puncte la fiecare articol
 * și să-l poți urca/coborî". Până atunci blogul se aranja singur, după dată.
 */

const rand = (id, position) => ({ id, position });
const lista = [rand("a", 10), rand("b", 20), rand("c", 30), rand("d", 40)];

test("mută mai sus: schimbă locul cu vecinul de deasupra și scrie doar două rânduri", () => {
  const r = mutaArticol(lista, "c", "sus");
  assert.deepEqual(r.ordine, ["a", "c", "b", "d"]);
  assert.deepEqual(r.scrieri, [rand("c", 20), rand("b", 30)]);
});

test("mută mai jos: schimbă locul cu vecinul de dedesubt", () => {
  const r = mutaArticol(lista, "b", "jos");
  assert.deepEqual(r.ordine, ["a", "c", "b", "d"]);
  assert.deepEqual(r.scrieri, [rand("c", 20), rand("b", 30)]);
});

test("primul nu poate urca, ultimul nu poate coborî, un id necunoscut nu face nimic", () => {
  assert.equal(mutaArticol(lista, "a", "sus"), null);
  assert.equal(mutaArticol(lista, "d", "jos"), null);
  assert.equal(mutaArticol(lista, "nu-exista", "sus"), null);
  assert.equal(mutaArticol([], "a", "sus"), null);
  assert.equal(mutaArticol([rand("singur", 0)], "singur", "jos"), null);
});

test("la poziții egale (rânduri seedate, toate 0) mutarea tot iese corectă", () => {
  // Cu doar schimbul între vecini, un al treilea rând cu aceeași poziție ar fi
  // putut sări peste unul dintre ei la departajare; renumerotarea nu are cazul.
  const egale = [rand("a", 0), rand("b", 0), rand("c", 0)];
  const r = mutaArticol(egale, "c", "sus");
  assert.deepEqual(r.ordine, ["a", "c", "b"]);
  const pozitii = new Map(egale.map((x) => [x.id, x.position]));
  for (const s of r.scrieri) pozitii.set(s.id, s.position);
  const dupaPozitie = [...pozitii].sort((x, y) => x[1] - y[1]).map(([id]) => id);
  assert.deepEqual(dupaPozitie, ["a", "c", "b"]);
  assert.equal(new Set(pozitii.values()).size, 3, "pozițiile devin distincte");
});

test("după un articol nou (poziția minimă − 10) mutarea scoate ordinea corectă și renumerotează", () => {
  const cuNou = [rand("nou", 0), rand("a", 10), rand("b", 20)];
  const r = mutaArticol(cuNou, "nou", "jos");
  assert.deepEqual(r.ordine, ["a", "nou", "b"]);
  const pozitii = new Map(cuNou.map((x) => [x.id, x.position]));
  for (const s of r.scrieri) pozitii.set(s.id, s.position);
  assert.deepEqual(
    [...pozitii].sort((x, y) => x[1] - y[1]).map(([id]) => id),
    ["a", "nou", "b"],
  );
});

test("mutări repetate nu stricează ordinea: aplicate pe rând, lista se potrivește cu ce s-ar citi din bază", () => {
  let curent = lista;
  const asteptat = ["a", "b", "c", "d"];
  const pasi = [["d", "sus"], ["d", "sus"], ["a", "jos"], ["c", "sus"], ["b", "jos"]];
  for (const [id, directie] of pasi) {
    const r = mutaArticol(curent, id, directie);
    const mutat = asteptat.indexOf(id);
    const tinta = directie === "sus" ? mutat - 1 : mutat + 1;
    if (tinta < 0 || tinta >= asteptat.length) {
      assert.equal(r, null);
      continue;
    }
    [asteptat[mutat], asteptat[tinta]] = [asteptat[tinta], asteptat[mutat]];
    const pozitii = new Map(curent.map((x) => [x.id, x.position]));
    for (const s of r.scrieri) pozitii.set(s.id, s.position);
    curent = [...pozitii].map(([id, position]) => rand(id, position)).sort((x, y) => x.position - y.position);
    assert.deepEqual(curent.map((x) => x.id), asteptat);
  }
});

test("articolul nou se pune înaintea tuturor; primul din site începe de la 0", () => {
  assert.equal(pozitiaArticoluluiNou(null), 0);
  assert.equal(pozitiaArticoluluiNou(10), 0);
  assert.equal(pozitiaArticoluluiNou(0), -10);
  assert.ok(pozitiaArticoluluiNou(-30) < -30);
});

test("mutaInLista (panoul, înainte de răspunsul serverului) dă aceeași ordine ca serverul", () => {
  const randuri = [{ id: "a", t: 1 }, { id: "b", t: 2 }, { id: "c", t: 3 }];
  assert.deepEqual(mutaInLista(randuri, "c", "sus").map((r) => r.id), ["a", "c", "b"]);
  assert.deepEqual(mutaInLista(randuri, "a", "jos").map((r) => r.id), ["b", "a", "c"]);
  assert.equal(mutaInLista(randuri, "a", "sus"), null);
  // Rândurile se păstrează întregi, nu doar id-urile.
  assert.equal(mutaInLista(randuri, "c", "sus")[1].t, 3);
});

const LANT_ORDINE =
  /\.order\("position", \{ ascending: true \}\)\s*\.order\("published_at", \{ ascending: false, nullsFirst: false \}\)\s*\.order\("created_at", \{ ascending: false \}\)/;

test("aceeași ordine în panou, pe blogul public și la mutare", () => {
  for (const cale of [
    "src/app/dashboard/blog/page.tsx",
    "src/lib/blog-public.ts",
    "src/app/dashboard/blog/actions.ts",
  ]) {
    assert.match(readFileSync(cale, "utf8"), LANT_ORDINE, `${cale} ordonează după poziție, apoi dată, apoi creare`);
  }
});

test("articolul nou ia poziția de început, iar mutarea nu cere bară de salvare", () => {
  const actiuni = readFileSync("src/app/dashboard/blog/actions.ts", "utf8");
  assert.match(actiuni, /position: pozitiaArticoluluiNou\(primul\?\.position \?\? null\)/);
  assert.match(actiuni, /export async function mutaArticolul\(/);
  // Ordinea se ia din bază, scrierea e limitată la site-ul sesiunii.
  const corp = actiuni.slice(actiuni.indexOf("export async function mutaArticolul("));
  assert.match(corp, /\.eq\("site_id", session\.siteId\)/);
  assert.match(corp, /reimprospateaza\(\)/);
});

test("lista din panou: meniul „⋯” cu „Mută mai sus / mai jos”, doar când sunt cel puțin două articole", () => {
  const lista = readFileSync("src/app/dashboard/blog/lista.tsx", "utf8");
  assert.match(lista, /randuri\.length > 1 &&/);
  assert.match(lista, /eticheta: "Mută mai sus"/);
  assert.match(lista, /eticheta: "Mută mai jos"/);
  assert.match(lista, /dezactivata: index === 0/);
  assert.match(lista, /dezactivata: index === randuri\.length - 1/);
});

test("migrarea păstrează ordinea de până acum și schema de verificare cunoaște coloana", () => {
  const migrare = readFileSync("supabase/migrations/20261005120000_ordine_articole.sql", "utf8");
  assert.match(migrare, /add column position integer not null default 0/);
  assert.match(migrare, /partition by site_id\s+order by published_at desc nulls last, created_at desc/);
  for (const f of ["supabase/verificare-schema.sql", "supabase/verificare-completa.sql"]) {
    assert.match(readFileSync(f, "utf8"), /'public\.blog_articles\.position', 'integer not null implicit 0'/);
  }
});
