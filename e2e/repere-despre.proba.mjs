import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { catreEditor, valideaza } from "@/lib/sectiuni-editare";
import { metaSectiune } from "@/lib/sectiuni";

/**
 * Reperele de sub „Despre mine": cel mult trei, pe un rând, fără să iasă din
 * pagină. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 4 oct. 2026, pe Căldură: un al treilea reper cu un
 * cuvânt lung („fdgfddgfdgdfdf") ieșea din pagină în dreapta; „Specializare"
 * se rupea în „Specializa-re". Măsurat după reparație, pe toate cinci
 * șabloanele, la 1280px și 390px: niciun text mare nu iese din reperul lui.
 */

function valideazaRepere(cate) {
  const meta = metaSectiune("aboutTeaser");
  const etichete = Array.from({ length: cate }, (_, i) => ({ mare: `${i + 1}+`, mic: "ani" }));
  const valoare = catreEditor({ titlu: "Despre", paragrafe: ["Text."], etichete }, meta.campuri);
  return valideaza(valoare, meta.campuri);
}

test("trei repere trec, al patrulea e refuzat și pe server", () => {
  assert.equal(valideazaRepere(3).etichete, undefined);
  assert.ok(valideazaRepere(4).etichete, "patru repere trebuie refuzate");
});

test("pe site se văd cel mult trei, chiar dacă un conținut vechi are patru", () => {
  const sursa = readFileSync("src/components/site/sections/about-teaser.tsx", "utf8");
  assert.match(sursa, /\.filter\(\(e\) => e\?\.mare\?\.trim\(\)\)\.slice\(0, 3\)/);
});

test("pe ecran lat, toate reperele pe UN rând", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /\.repere-rand \{\s*grid-template-columns: repeat\(var\(--repere, 3\), minmax\(0, 1fr\)\);/);
});

test("textul mare se micșorează după cel mai lung cuvânt și fontul șablonului", () => {
  const sursa = readFileSync("src/components/site/sections/about-teaser.tsx", "utf8");
  const fonturi = readFileSync("src/lib/templates/fonturi.ts", "utf8");

  assert.match(sursa, /calc\(100cqw \/ \(var\(--cuvant\) \* var\(--t-latime-litera-secundar, 0\.53\)\)\)/);
  assert.match(sursa, /containerType: "inline-size"/);
  assert.match(fonturi, /"--t-latime-litera-secundar"/);
  // Fiecare font secundar folosit de un șablon are lățimea lui măsurată.
  for (const font of ["Caveat", '"Cormorant Garamond"', "Inter"]) {
    assert.match(fonturi, new RegExp(`${font}: 0\\.\\d+`), `${font} are lățimea măsurată`);
  }
});

test("„Domenii / teme” apar pe TOATE șabloanele, nu doar pe Apropiere", () => {
  // Până pe 4 oct. 2026 apăreau doar pe Apropiere, deși câmpul e în panoul
  // tuturor: proprietarul a scris „Traumă” pe Căldură și nu s-a întâmplat nimic.
  const sursa = readFileSync("src/components/site/sections/about-teaser.tsx", "utf8");
  assert.match(sursa, /\{data\.teme\?\.some\(\(t\) => t\?\.trim\(\)\) && \(/);
  assert.doesNotMatch(sursa, /friendly && data\.teme/);
});

test("niciun text de ajutor din secțiuni nu pomenește un șablon", () => {
  // Clientul își vede doar șablonul lui; „pe șablonul Apropiere” îl încurca.
  const sectiuni = readFileSync("src/lib/sectiuni.ts", "utf8");
  const hinturi = sectiuni.match(/hint:\s*"[^"]*"/g) ?? [];
  for (const h of hinturi) {
    assert.doesNotMatch(h, /Liniște|Apropiere|Căldură|Lumină|Claritate|șablon/i, h);
  }
});

test("textul de ajutor de la „Domenii / teme” spune limita, aceeași cu cea verificată", () => {
  const camp = metaSectiune("aboutTeaser").campuri.find((c) => c.cheie === "teme");
  assert.equal(camp.max, 6);
  assert.match(camp.hint, new RegExp(`cel mult ${camp.max} domenii/teme`));
});
