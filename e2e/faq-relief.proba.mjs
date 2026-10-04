import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getTemplate } from "@/lib/templates";

/**
 * „Întrebări frecvente" pe fundalul „relief", doar la Căldură. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026, cu o mostră de culoare: rgb(223,216,209),
 * adică chiar `fundalRelief` al Căldurii (#DFD8D1). Tratament vizual → doar unde
 * s-a cerut.
 *
 * Capcana prinsă la măsurare: liniile dintre întrebări erau `--t-chenar`, care la
 * Căldură e IDENTIC cu fundalul relief (#DFD8D1) — pe noul fundal ar fi dispărut.
 */

test("aprins doar la Căldură, iar mostra proprietarului e fundalul „relief” al ei", () => {
  assert.equal(getTemplate("caldura").asezari.faqRelief, true);
  assert.equal(getTemplate("caldura").paleta.fundalRelief.toUpperCase(), "#DFD8D1");
  for (const id of ["liniste", "lumina", "apropiere", "claritate"]) {
    assert.ok(!getTemplate(id).asezari.faqRelief, `${id} își păstrează tonul rândului`);
  }
});

test("steagul schimbă tonul doar la FAQ", () => {
  const sursa = readFileSync("src/components/site/render-sections.tsx", "utf8");
  assert.match(sursa, /tone=\{ctx\.asezari\.faqRelief \? "relief" : row\.tone\}/);
});

test("pe relief, liniile nu mai sunt `--t-chenar` (care la Căldură = fundalul)", () => {
  const caldura = getTemplate("caldura").paleta;
  // Premisa capcanei: chenarul și fundalul relief sunt aceeași culoare.
  assert.equal(caldura.chenar.toUpperCase(), caldura.fundalRelief.toUpperCase());

  const faq = readFileSync("src/components/site/sections/faq.tsx", "utf8");
  assert.match(faq, /tone === "relief"\s*\? "color-mix\(in oklab, currentColor 20%, transparent\)"\s*: "var\(--t-chenar\)"/);
  assert.match(faq, /borderTop: `1px solid \$\{linie\}`/);
});
