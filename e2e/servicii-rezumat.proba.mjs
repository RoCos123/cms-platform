import assert from "node:assert/strict";
import test from "node:test";
import { rezumatServiciu } from "@/lib/servicii";

/**
 * Rezumatul de pe cartonaș se scoate din descriere — probat aici fiindcă e
 * regula care decide ce vede vizitatorul pe prima pagină, iar dacă tace, tace
 * tăcut. Schimbat pe 10 sept. 2026: clientul scrie o singură descriere, text
 * simplu, FĂRĂ `##` — deci rezumatul ia pur și simplu primul rând.
 */

test("ia primul rând al descrierii", () => {
  const descriere = "Ne vedem o dată pe săptămână, câte 50 de minute.";
  assert.equal(rezumatServiciu(descriere), "Ne vedem o dată pe săptămână, câte 50 de minute.");
});

test("ia PRIMUL rând când sunt mai multe paragrafe", () => {
  const descriere = "Primul rând, cârligul.\nAl doilea paragraf, mai mult.";
  assert.equal(rezumatServiciu(descriere), "Primul rând, cârligul.");
});

test("un `##` rămas din greșeală e text simplu, nu subtitlu sărit", () => {
  // La servicii subtitlurile sunt oprite: linia cu ## devine text obișnuit, cu
  // diezii scoși. Clientul nu mai e îndemnat să scrie cu ##, dar dacă o face,
  // nu iese urât și nici nu-i dispare rândul din rezumat.
  assert.equal(rezumatServiciu("## Cum decurge\nNe vedem o dată."), "Cum decurge");
  assert.equal(rezumatServiciu("## Doar un titlu"), "Doar un titlu");
});

test("un text scurt rămâne întreg, netăiat", () => {
  assert.equal(rezumatServiciu("Consiliere de scurtă durată."), "Consiliere de scurtă durată.");
});

test("un text lung se taie la o margine de cuvânt, cu trei puncte", () => {
  const lung = "cuvant ".repeat(60).trim();
  const r = rezumatServiciu(lung);
  assert.ok(r.length <= 201, `prea lung: ${r.length}`);
  assert.ok(r.endsWith("…"), "ar trebui să se termine cu trei puncte");
  assert.ok(!r.includes("cuva…"), "nu taie în mijlocul unui cuvânt");
});

test("gol rămâne gol, nu aruncă", () => {
  assert.equal(rezumatServiciu(""), "");
  assert.equal(rezumatServiciu("   \n  "), "");
});
