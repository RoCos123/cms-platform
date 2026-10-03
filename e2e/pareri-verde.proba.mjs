import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getTemplate } from "@/lib/templates";

/**
 * „Păreri" pe verde, doar la Liniște. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 3 oct. 2026, cu o captură a culorii dorite; verdele e
 * măsurat pe ea (rgb(65,84,71) la bază). Ce ține proba: că e DOAR la Liniște
 * (tratamentele vizuale se aprind doar unde s-au cerut) și că pe verde
 * cardurile sunt albe, ca pașii din „Cum decurge colaborarea" (cerut tot atunci).
 */

test("steagul e aprins doar la Liniște", () => {
  for (const id of ["caldura", "lumina", "apropiere", "claritate"]) {
    assert.ok(!getTemplate(id).asezari.testimonialeVerde, `${id} nu trebuie să aibă păreri pe verde`);
  }
  assert.equal(getTemplate("liniste").asezari.testimonialeVerde, true);
});

test("pe verde, cardurile de păreri sunt ca pașii din „Cum decurge colaborarea”", () => {
  const sursa = readFileSync("src/components/site/sections/testimonials.tsx", "utf8");
  const pasi = readFileSync("src/components/site/sections/how-it-works.tsx", "utf8");

  assert.match(sursa, /#415447/, "baza verdelui: rgb(65,84,71)");
  assert.match(sursa, /tone=\{verde \? "inchis" : tone\}/, "titlul secțiunii, deschis pe verde");

  // Aceleași valori ca la cardul de pas, ca să nu se depărteze în tăcere.
  for (const v of [
    'background: "var(--t-suprafata, #ffffff)"',
    'border: "1px solid var(--t-chenar)"',
    'padding: "clamp(28px, 3vw, 40px)"',
    'color: "var(--t-text)"',
  ]) {
    assert.ok(pasi.includes(v), `pasul are ${v}`);
    assert.ok(sursa.includes(v), `cardul de păreri are ${v}`);
  }
  assert.match(sursa, /color: verde \? "var\(--t-text-secundar\)"/, "textul mic, culoarea șablonului pe alb");
});

test("render-sections transmite steagul", () => {
  const sursa = readFileSync("src/components/site/render-sections.tsx", "utf8");
  assert.match(sursa, /verde=\{ctx\.asezari\.testimonialeVerde\}/);
});
