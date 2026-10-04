import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getTemplate } from "@/lib/templates";

/**
 * Banda cu citat pe fundalul „relief", doar la Căldură, Apropiere și Claritate. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026, cu o mostră de culoare: rgb(223,216,209),
 * adică chiar `fundalRelief` al Căldurii (#DFD8D1). Tratament vizual → doar unde
 * s-a cerut.
 */

test("aprins doar la Căldură, Apropiere și Claritate; mostra proprietarului = fundalul „relief” al fiecăreia", () => {
  // Mostrele, măsurate pe capturile proprietarului (5 oct. 2026).
  const mostre = { caldura: "#DFD8D1", apropiere: "#E8DCC8", claritate: "#DFE6EE" };
  for (const [id, culoare] of Object.entries(mostre)) {
    assert.equal(getTemplate(id).asezari.citatRelief, true, `${id} are citatul pe relief`);
    assert.equal(getTemplate(id).paleta.fundalRelief.toUpperCase(), culoare, `${id}: mostra`);
  }
  for (const id of ["liniste", "lumina"]) {
    assert.ok(!getTemplate(id).asezari.citatRelief, `${id} își păstrează tonul rândului`);
  }
});

test("steagul schimbă tonul doar la citat", () => {
  const sursa = readFileSync("src/components/site/render-sections.tsx", "utf8");
  assert.match(sursa, /tone=\{ctx\.asezari\.citatRelief \? "relief" : row\.tone\}/);
});
