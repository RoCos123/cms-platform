import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getTemplate } from "@/lib/templates";

/**
 * Banda cu citat pe fundalul „relief", doar la Căldură. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026, cu o mostră de culoare: rgb(223,216,209),
 * adică chiar `fundalRelief` al Căldurii (#DFD8D1). Tratament vizual → doar unde
 * s-a cerut.
 */

test("aprins doar la Căldură, iar mostra proprietarului e fundalul „relief” al ei", () => {
  assert.equal(getTemplate("caldura").asezari.citatRelief, true);
  assert.equal(getTemplate("caldura").paleta.fundalRelief.toUpperCase(), "#DFD8D1");
  for (const id of ["liniste", "lumina", "apropiere", "claritate"]) {
    assert.ok(!getTemplate(id).asezari.citatRelief, `${id} își păstrează tonul rândului`);
  }
});

test("steagul schimbă tonul doar la citat", () => {
  const sursa = readFileSync("src/components/site/render-sections.tsx", "utf8");
  assert.match(sursa, /tone=\{ctx\.asezari\.citatRelief \? "relief" : row\.tone\}/);
});
