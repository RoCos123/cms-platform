import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { raportRamei } from "@/lib/rame-poze";
import { getTemplate } from "@/lib/templates";

/**
 * Proba formelor de ramă. `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Rama în care se trage poza în panou era PĂTRATĂ peste tot,
 * deși pe site sunt șapte forme diferite. Ce încadra clientul nu era ce ieșea.
 * Mai rău: `object-fit: cover` lasă poza să se miște doar pe axa pe care îi
 * prisosește ceva, iar axa aia diferă de la o ramă la alta — proprietarul
 * trăgea în sus la „Despre mine", nu se întâmpla nimic, și nimic nu-i spunea
 * de ce (1 oct. 2026).
 *
 * `raportRamei` repetă, pentru panou, forme scrise în componentele site-ului.
 * Două locuri cu același adevăr se despart cu timpul, iar despărțirea e tăcută:
 * panoul ar arăta o ramă, site-ul alta, și nimic n-ar cădea. De-aia proba de
 * jos citește `aspectRatio`-urile CHIAR DIN componente și le compară.
 */

const COMPONENTE = {
  despre: readFileSync("src/components/site/sections/about-teaser.tsx", "utf8"),
  hero: readFileSync("src/components/site/sections/hero.tsx", "utf8"),
  portfolio: readFileSync("src/components/site/sections/portfolio.tsx", "utf8"),
};

test("Despre mine: dreptunghi vertical, cerc la Claritate", () => {
  const dreptunghi = raportRamei("aboutTeaser", "imagine", {
    asezari: getTemplate("lumina").asezari,
  });
  const cerc = raportRamei("aboutTeaser", "imagine", {
    asezari: getTemplate("claritate").asezari,
  });

  assert.equal(dreptunghi, "4 / 5");
  assert.equal(cerc, "1 / 1");
  // Aceleași valori trebuie să stea și în componentă.
  assert.match(COMPONENTE.despre, /aspectRatio=\{pozaRotunda \? "1 \/ 1" : "4 \/ 5"\}/);
});

test("prima secțiune: pătrat, peisaj unde poza e lată", () => {
  assert.equal(raportRamei("hero", "imagine", { asezari: getTemplate("liniste").asezari }), "1 / 1");
  assert.equal(raportRamei("hero", "imagine", { asezari: getTemplate("caldura").asezari }), "16 / 9");
  assert.match(COMPONENTE.hero, /pozaLata \? "16 \/ 9" : "1 \/ 1"/);
});

test("programe: cartonașul obișnuit 3/2, galeria de șabloane 16/9", () => {
  const asezari = getTemplate("claritate").asezari;

  assert.equal(raportRamei("portfolio", "elemente.0.imagine", { asezari }), "3 / 2");
  assert.equal(
    raportRamei("portfolio", "elemente.2.imagine", { asezari, variant: "vitrina" }),
    "16 / 9",
  );
  assert.match(COMPONENTE.portfolio, /aspectRatio="3 \/ 2"/);
  assert.match(COMPONENTE.portfolio, /aspectRatio="16 \/ 9"/);
});

test("indicele rândului nu schimbă forma", () => {
  const asezari = getTemplate("liniste").asezari;
  const prim = raportRamei("portfolio", "elemente.0.imagine", { asezari });

  for (const i of [1, 5, 17]) {
    assert.equal(raportRamei("portfolio", `elemente.${i}.imagine`, { asezari }), prim);
  }
});

test("un câmp necunoscut nu primește nicio formă, deci rama rămâne pătrată", () => {
  const asezari = getTemplate("liniste").asezari;

  assert.equal(raportRamei("secțiuneInventată", "imagine", { asezari }), undefined);
  assert.equal(raportRamei("aboutTeaser", "altCamp", { asezari }), undefined);
});

/*
 * Glisorul de mărire apare DOAR unde mărirea se poate salva.
 *
 * În formulare, pleacă în conținutul secțiunii odată cu punctul focal — deci e
 * pornit, pe toate șabloanele și la toate secțiunile (panoul e același pentru
 * toți). În Bibliotecă se scrie doar pe rândul din `uploads`, care ține
 * `focal_x`/`focal_y` și atât: acolo un glisor ar lăsa omul să miște poza, s-o
 * vadă schimbându-se, și să piardă totul la reîncărcare.
 *
 * Probă pe sursă: o scăpare aici nu dă nicio eroare, doar pierdere tăcută.
 */
test("Biblioteca nu oferă mărire, fiindcă n-ar avea unde s-o salveze", () => {
  const panou = readFileSync("src/app/dashboard/imagini/panou-imagine.tsx", "utf8");

  assert.match(panou, /cuMarire=\{false\}/);
});

test("formularele oferă mărire, pe orice șablon și orice secțiune", () => {
  const campuri = readFileSync("src/components/dashboard/campuri-sectiune.tsx", "utf8");

  // Nimic nu stinge glisorul pe drumul formularelor — nici direct, nici
  // condiționat de șablon.
  assert.doesNotMatch(campuri, /cuMarire/);
});
