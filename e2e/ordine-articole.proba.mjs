import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  locDeLasare,
  mutaInaintea,
  mutaInLista,
  pozitiaArticoluluiNou,
  tintaPentruPas,
} from "@/lib/ordine-articole";

/**
 * Ordinea articolelor de blog, mutată prin tragerea mânerului „⋯" din listă (sau
 * cu săgețile). `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026: „să poți urca/coborî articolele". Întâi a
 * fost un meniu cu „Mută mai sus/jos"; apoi: „ții apăsat pe cele trei puncte și
 * muți sus sau jos, drag and drop".
 */

const rand = (id, position) => ({ id, position });
const lista = [rand("a", 10), rand("b", 20), rand("c", 30), rand("d", 40)];

/** Ce ar citi baza după scrierile întoarse: id-urile în ordinea pozițiilor. */
function dupaScrieri(randuri, scrieri) {
  const pozitii = new Map(randuri.map((x) => [x.id, x.position]));
  for (const s of scrieri) pozitii.set(s.id, s.position);
  return [...pozitii].sort((x, y) => x[1] - y[1]).map(([id]) => id);
}

test("trage un articol înaintea altuia: ordinea nouă și doar rândurile care își schimbă poziția", () => {
  const r = mutaInaintea(lista, "c", "b");
  assert.deepEqual(r.ordine, ["a", "c", "b", "d"]);
  assert.deepEqual(r.scrieri, [rand("c", 20), rand("b", 30)]);
});

test("trage la început, la sfârșit și peste mai multe rânduri", () => {
  assert.deepEqual(mutaInaintea(lista, "d", "a").ordine, ["d", "a", "b", "c"]);
  assert.deepEqual(mutaInaintea(lista, "a", null).ordine, ["b", "c", "d", "a"]);
  assert.deepEqual(mutaInaintea(lista, "a", "d").ordine, ["b", "c", "a", "d"]);
  for (const [id, tinta] of [["d", "a"], ["a", null], ["a", "d"], ["b", "d"]]) {
    const r = mutaInaintea(lista, id, tinta);
    assert.deepEqual(dupaScrieri(lista, r.scrieri), r.ordine, `${id} → înaintea ${tinta}`);
  }
});

test("nimic de făcut: același loc, țintă necunoscută sau chiar el însuși", () => {
  assert.equal(mutaInaintea(lista, "b", "c"), null, "deja înaintea lui c");
  assert.equal(mutaInaintea(lista, "d", null), null, "deja ultimul");
  assert.equal(mutaInaintea(lista, "a", "a"), null);
  assert.equal(mutaInaintea(lista, "a", "nu-exista"), null);
  assert.equal(mutaInaintea(lista, "nu-exista", "a"), null);
  assert.equal(mutaInaintea([], "a", null), null);
});

test("la poziții egale (rânduri seedate, toate 0) mutarea tot iese corectă", () => {
  // Cu doar schimbul între doi, un al treilea rând cu aceeași poziție ar fi putut
  // sări peste unul dintre ei la departajare; renumerotarea nu are cazul.
  const egale = [rand("a", 0), rand("b", 0), rand("c", 0)];
  const r = mutaInaintea(egale, "c", "b");
  assert.deepEqual(r.ordine, ["a", "c", "b"]);
  assert.deepEqual(dupaScrieri(egale, r.scrieri), ["a", "c", "b"]);
  const pozitii = new Set(r.scrieri.map((x) => x.position));
  assert.equal(r.scrieri.length, 3);
  assert.equal(pozitii.size, 3, "pozițiile devin distincte");
});

test("după un articol nou (poziția minimă − 10) mutarea scoate ordinea corectă și renumerotează", () => {
  const cuNou = [rand("nou", 0), rand("a", 10), rand("b", 20)];
  const r = mutaInaintea(cuNou, "nou", "b");
  assert.deepEqual(r.ordine, ["a", "nou", "b"]);
  assert.deepEqual(dupaScrieri(cuNou, r.scrieri), ["a", "nou", "b"]);
});

test("mutări repetate nu stricează ordinea: lista se potrivește cu ce s-ar citi din bază", () => {
  let curent = lista;
  const pasi = [["d", "a"], ["a", null], ["c", "d"], ["b", "a"], ["d", null]];
  for (const [id, tinta] of pasi) {
    const r = mutaInaintea(curent, id, tinta);
    if (!r) continue;
    const pozitii = new Map(curent.map((x) => [x.id, x.position]));
    for (const s of r.scrieri) pozitii.set(s.id, s.position);
    curent = [...pozitii].map(([i, position]) => rand(i, position)).sort((x, y) => x.position - y.position);
    assert.deepEqual(curent.map((x) => x.id), r.ordine);
  }
});

test("o listă veche nu produce o mutare greșită: ținta e un articol numit, nu un index", () => {
  // Panoul crede [a b c d]; între timp serverul are [b a c d]. „c înaintea lui a"
  // înseamnă același lucru în ambele: c se pune lângă a, nu pe un index care a
  // ajuns să fie altceva.
  const laServer = [rand("b", 10), rand("a", 20), rand("c", 30), rand("d", 40)];
  assert.deepEqual(mutaInaintea(laServer, "c", "a").ordine, ["b", "c", "a", "d"]);
  // Țintă dispărută între timp (ștearsă din alt panou): nu se scrie nimic.
  assert.equal(mutaInaintea(laServer.slice(0, 2), "a", "c"), null);
});

test("săgețile: ținta pentru un pas în sus sau în jos, cu capetele respinse", () => {
  const ids = ["a", "b", "c", "d"];
  assert.equal(tintaPentruPas(ids, "c", "sus"), "b");
  assert.equal(tintaPentruPas(ids, "b", "jos"), "d", "peste c, deci înaintea lui d");
  assert.equal(tintaPentruPas(ids, "c", "jos"), null, "penultimul coboară la coadă");
  assert.equal(tintaPentruPas(ids, "a", "sus"), undefined);
  assert.equal(tintaPentruPas(ids, "d", "jos"), undefined);
  assert.equal(tintaPentruPas(ids, "nu-exista", "sus"), undefined);
  // Ținta dă aceeași ordine ca un pas real.
  assert.deepEqual(mutaInaintea(lista, "b", tintaPentruPas(ids, "b", "jos")).ordine, ["a", "c", "b", "d"]);
  assert.deepEqual(mutaInaintea(lista, "c", tintaPentruPas(ids, "c", "sus")).ordine, ["a", "c", "b", "d"]);
});

test("locul de lăsare: se compară cu MIJLOACELE celorlalte rânduri", () => {
  // Trei rânduri rămase, cu mijloacele la 50, 150, 300 (înălțimi diferite).
  const mijloace = [50, 150, 300];
  assert.equal(locDeLasare(mijloace, 10), 0, "deasupra tuturor");
  assert.equal(locDeLasare(mijloace, 49), 0, "încă n-a depășit mijlocul primului");
  assert.equal(locDeLasare(mijloace, 51), 1, "a depășit mijlocul primului");
  assert.equal(locDeLasare(mijloace, 200), 2);
  assert.equal(locDeLasare(mijloace, 999), 3, "sub toate: la coadă");
  assert.equal(locDeLasare([], 100), 0, "singur în listă");
});

test("articolul nou se pune înaintea tuturor; primul din site începe de la 0", () => {
  assert.equal(pozitiaArticoluluiNou(null), 0);
  assert.equal(pozitiaArticoluluiNou(10), 0);
  assert.equal(pozitiaArticoluluiNou(0), -10);
  assert.ok(pozitiaArticoluluiNou(-30) < -30);
});

test("mutaInLista (panoul, înainte de răspunsul serverului) dă aceeași ordine ca serverul", () => {
  const randuri = [{ id: "a", t: 1 }, { id: "b", t: 2 }, { id: "c", t: 3 }];
  assert.deepEqual(mutaInLista(randuri, "c", "b").map((r) => r.id), ["a", "c", "b"]);
  assert.deepEqual(mutaInLista(randuri, "a", null).map((r) => r.id), ["b", "c", "a"]);
  assert.equal(mutaInLista(randuri, "a", "b"), null);
  // Rândurile se păstrează întregi, nu doar id-urile.
  assert.equal(mutaInLista(randuri, "c", "b")[1].t, 3);
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

test("articolul nou ia poziția de început, iar mutarea se salvează pe loc, limitată la site-ul sesiunii", () => {
  const actiuni = readFileSync("src/app/dashboard/blog/actions.ts", "utf8");
  assert.match(actiuni, /position: pozitiaArticoluluiNou\(primul\?\.position \?\? null\)/);
  assert.match(actiuni, /export async function mutaArticolul\(\s*id: string,\s*inaintea: string \| null,/);
  const corp = actiuni.slice(actiuni.indexOf("export async function mutaArticolul("));
  assert.match(corp, /\.eq\("site_id", session\.siteId\)/);
  assert.match(corp, /mutaInaintea\(randuri, id, inaintea\)/);
  assert.match(corp, /reimprospateaza\(\)/);
});

test("lista din panou: mânerul „⋯” se trage (pointer, nu meniu), merge și pe deget și din săgeți, doar cu 2+ articole", () => {
  const lista = readFileSync("src/app/dashboard/blog/lista.tsx", "utf8");
  assert.match(lista, /randuri\.length > 1 &&/);
  assert.match(lista, /onPointerDown=\{\(eveniment\) => incepeTragerea\(eveniment, rand\)\}/);
  assert.match(lista, /onPointerUp=\{\(\) => incheieTragerea\(true\)\}/);
  assert.match(lista, /onPointerCancel=\{\(\) => incheieTragerea\(false\)\}/);
  assert.match(lista, /setPointerCapture/);
  // Fără `touch-none` degetul derulează pagina în loc să tragă.
  assert.match(lista, /touch-none/);
  assert.match(lista, /eveniment\.key === "ArrowUp"/);
  // Nu se mai folosește meniul, nici tragerea nativă (care nu merge pe telefon).
  assert.doesNotMatch(lista, /<MeniuActiuni|draggable=|onDragStart/);
});

test("migrarea păstrează ordinea de până acum și schema de verificare cunoaște coloana", () => {
  const migrare = readFileSync("supabase/migrations/20261005120000_ordine_articole.sql", "utf8");
  assert.match(migrare, /add column position integer not null default 0/);
  assert.match(migrare, /partition by site_id\s+order by published_at desc nulls last, created_at desc/);
  for (const f of ["supabase/verificare-schema.sql", "supabase/verificare-completa.sql"]) {
    assert.match(readFileSync(f, "utf8"), /'public\.blog_articles\.position', 'integer not null implicit 0'/);
  }
});
