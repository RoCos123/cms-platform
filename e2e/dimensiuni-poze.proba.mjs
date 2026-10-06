import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DIMENSIUNI_POZE, locPozaSectiune, textDimensiuni, dimensiuniPozaSectiune } from "@/lib/dimensiuni-poze";
import { raportRamei } from "@/lib/rame-poze";
import { getTemplate } from "@/lib/templates";

/**
 * Mărimile de poză spuse în panou, sub „Trage o imagine aici…". `pnpm test:logica`.
 *
 * Cerut de proprietar pe 6 oct. 2026: să scrie în panou ce dimensiuni sunt potrivite.
 * Înainte, la prima secțiune scria „pătrată sau verticală" deși la două șabloane
 * poza de acolo e lată (16:9).
 */

const SABLOANE = ["caldura", "liniste", "lumina", "apropiere", "claritate"];
const raportNumar = (r) => {
  const [a, b] = r.split("/").map(Number);
  return a / b;
};
const peste = (a, b) => Math.abs(a - b) / b;

test("recomandatul și minimul au FORMA ramei de pe site (toleranță 1,5% pentru rotunjire)", () => {
  for (const [loc, d] of Object.entries(DIMENSIUNI_POZE)) {
    const tinta = raportNumar(d.raport);
    assert.ok(peste(d.recomandat[0] / d.recomandat[1], tinta) < 0.015, `${loc}: recomandat ${d.recomandat} ≠ ${d.raport}`);
    assert.ok(peste(d.minim[0] / d.minim[1], tinta) < 0.015, `${loc}: minim ${d.minim} ≠ ${d.raport}`);
  }
});

test("minimul e sub recomandat, iar recomandatul nu trece de ce servește optimizatorul (2048 px)", () => {
  for (const [loc, d] of Object.entries(DIMENSIUNI_POZE)) {
    assert.ok(d.minim[0] < d.recomandat[0] && d.minim[1] < d.recomandat[1], `${loc}: minimul nu e sub recomandat`);
    assert.ok(d.recomandat[0] <= 2048 && d.recomandat[1] <= 2048, `${loc}: recomandat prea mare`);
  }
});

test("locul și forma urmează șablonul, la fel ca rama din panou", () => {
  for (const id of SABLOANE) {
    const asezari = getTemplate(id).asezari;
    const ctx = { asezari };

    const hero = locPozaSectiune("hero", "imagine", ctx);
    assert.equal(hero, asezari.hero === "pozaLata" ? "heroLat" : "heroPatrat", `${id} hero`);
    assert.equal(DIMENSIUNI_POZE[hero].raport.replace(/ /g, ""), raportRamei("hero", "imagine", ctx).replace(/ /g, ""), `${id} hero ↔ rama`);

    const despre = locPozaSectiune("aboutTeaser", "imagine", ctx);
    assert.equal(despre, asezari.desprePozaRotunda ? "despreRotund" : "despre", `${id} despre`);
    assert.equal(DIMENSIUNI_POZE[despre].raport, raportRamei("aboutTeaser", "imagine", ctx), `${id} despre ↔ rama`);
  }
  // Cele două forme de hero chiar apar: două șabloane late, trei pătrate.
  const lat = SABLOANE.filter((id) => locPozaSectiune("hero", "imagine", { asezari: getTemplate(id).asezari }) === "heroLat");
  assert.deepEqual(lat.sort(), ["caldura", "claritate"]);
});

test("programe și apariții: același loc ca rama (vitrina 16:9, programul 3:2, apariția 16:9)", () => {
  const asezari = getTemplate("caldura").asezari;
  assert.equal(locPozaSectiune("portfolio", "elemente.2.imagine", { asezari, variant: "vitrina" }), "vitrina");
  assert.equal(locPozaSectiune("portfolio", "elemente.0.imagine", { asezari, variant: null }), "program");
  assert.equal(locPozaSectiune("logos", "elemente.1.imagine", { asezari }), "aparitie");
  assert.equal(DIMENSIUNI_POZE.program.raport, raportRamei("portfolio", "elemente.imagine", { asezari }));
  assert.equal(DIMENSIUNI_POZE.vitrina.raport, raportRamei("portfolio", "elemente.imagine", { asezari, variant: "vitrina" }));
  assert.equal(DIMENSIUNI_POZE.aparitie.raport, raportRamei("logos", "elemente.imagine", { asezari }));
});

test("un câmp netrecut aici nu primește o presupunere", () => {
  const asezari = getTemplate("caldura").asezari;
  assert.equal(dimensiuniPozaSectiune("features", "imagine", { asezari }), undefined);
  assert.equal(dimensiuniPozaSectiune("hero", "altceva", { asezari }), undefined);
});

test("formele coperților sunt cele din componentele de pe site", () => {
  assert.match(readFileSync("src/components/site/sections/servicii-detaliate.tsx", "utf8"), /aspectRatio="16 \/ 7"/);
  assert.match(readFileSync("src/components/site/sections/articol-complet.tsx", "utf8"), /aspectRatio="16 \/ 9"/);
  assert.equal(DIMENSIUNI_POZE.serviciuBanda.raport, "16 / 7");
  assert.equal(DIMENSIUNI_POZE.articol.raport, "16 / 9");
});

test("textul: spune forma, recomandatul și minimul; nu pomenește numele unui șablon", () => {
  for (const loc of Object.keys(DIMENSIUNI_POZE)) {
    const t = textDimensiuni(loc);
    const d = DIMENSIUNI_POZE[loc];
    assert.ok(t.includes(`${d.recomandat[0]} × ${d.recomandat[1]} px`), `${loc}: lipsește recomandatul`);
    assert.ok(t.includes(`cel puțin ${d.minim[0]} × ${d.minim[1]} px`), `${loc}: lipsește minimul`);
    assert.ok(t.includes(d.forma), `${loc}: lipsește forma`);
    // Un client de pe un șablon nu trebuie să afle de celelalte (3 oct. 2026).
    assert.doesNotMatch(t, /Căldur|Liniște|Lumin|Apropiere|Claritate|șablon/i, `${loc}: pomenește un șablon`);
  }
  assert.match(textDimensiuni("heroLat"), /2000 × 1125 px/);
  assert.match(textDimensiuni("heroPatrat"), /1200 × 1200 px/);
  // La serviciul cu cerc pe prima pagină, textul spune ce se întâmplă cu cercul.
  assert.match(textDimensiuni("serviciuRotund"), /mijlocul pozei/);
});

test("cablarea: cele trei editoare dau textul, iar câmpul de imagine îl arată înaintea celui fix", () => {
  assert.match(readFileSync("src/components/dashboard/campuri-sectiune.tsx", "utf8"), /dimensiuni=\{dimensiuniPentru\?\.\(drum\) \?\? camp\.dimensiuni\}/);
  assert.match(readFileSync("src/app/dashboard/sectiuni/[id]/editor.tsx", "utf8"), /dimensiuniPentru=\{\(drum\) => dimensiuniPozaSectiune\(meta\.cheie, drum/);
  const servicii = readFileSync("src/app/dashboard/servicii/[id]/editor.tsx", "utf8");
  assert.match(servicii, /textDimensiuni\(template\.asezari\.serviciiImagine \? "serviciuRotund" : "serviciuBanda"\)/);
  assert.match(readFileSync("src/app/dashboard/blog/[id]/editor.tsx", "utf8"), /textDimensiuni\("articol"\)/);
});

test("textul de ajutor de la poza din hero nu mai spune forme false pentru șabloanele late", () => {
  const sectiuni = readFileSync("src/lib/sectiuni.ts", "utf8");
  const hero = sectiuni.slice(sectiuni.indexOf('cheie: "hero"'), sectiuni.indexOf('cheie: "aboutTeaser"'));
  assert.doesNotMatch(hero, /pătrată sau verticală/);
  // „Despre mine" e vertical sau rotund (pătrat) la toate șabloanele: textul rămâne adevărat.
  const despre = sectiuni.slice(sectiuni.indexOf('cheie: "aboutTeaser"'), sectiuni.indexOf('cheie: "quote"'));
  assert.match(despre, /pătrată sau verticală/);
});
