import assert from "node:assert/strict";
import test from "node:test";
import { rezumatServiciu } from "@/lib/servicii";

/**
 * Rezumatul de pe cartonaș se scoate din descriere — probat aici fiindcă e
 * regula care decide ce vede vizitatorul pe prima pagină, iar dacă tace, tace
 * tăcut. Schimbat pe 10 sept. 2026: clientul scrie o singură descriere, nu un
 * scurt și un lung.
 */

test("ia primul paragraf, sărind peste un subtitlu de la început", () => {
  // Exact cazul care l-a încurcat pe proprietar: subtitlu cu ## + un paragraf.
  const descriere = "## Cum decurge\nNe vedem o dată pe săptămână, câte 50 de minute.";
  assert.equal(rezumatServiciu(descriere), "Ne vedem o dată pe săptămână, câte 50 de minute.");
});

test("un text scurt rămâne întreg, netăiat", () => {
  assert.equal(rezumatServiciu("Consiliere de scurtă durată."), "Consiliere de scurtă durată.");
});

test("un text lung se taie la o margine de cuvânt, cu trei puncte", () => {
  const lung = "cuvant ".repeat(60).trim(); // mult peste 200 de caractere
  const r = rezumatServiciu(lung);
  assert.ok(r.length <= 201, `prea lung: ${r.length}`);
  assert.ok(r.endsWith("…"), "ar trebui să se termine cu trei puncte");
  assert.ok(!r.includes("cuva…"), "nu taie în mijlocul unui cuvânt");
});

test("doar un subtitlu, fără paragraf, dă rezumat gol", () => {
  assert.equal(rezumatServiciu("## Doar un titlu"), "");
});

test("gol rămâne gol, nu aruncă", () => {
  assert.equal(rezumatServiciu(""), "");
  assert.equal(rezumatServiciu("   \n  "), "");
});

test("ia PRIMUL paragraf, nu tot textul lipit", () => {
  const descriere = "Primul rând, cârligul.\nAl doilea paragraf, mai mult.";
  assert.equal(rezumatServiciu(descriere), "Primul rând, cârligul.");
});
