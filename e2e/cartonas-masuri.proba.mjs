import assert from "node:assert/strict";
import test from "node:test";
import { MARIMEA_CARTONASULUI, marimeaNumelui } from "@/lib/cartonas-masuri";

/**
 * Proba cartonașului. Se rulează cu `pnpm test:logica`.
 *
 * Aici se prind doar pragurile. Că desenul chiar încape s-a verificat uitându-mă
 * la imagine, la cele două extreme: un nume de 120 de caractere (limita din
 * `CAMPURI_CABINET`) și unul de șapte, fără subtitlu și fără acreditare.
 * Testele astea sunt ca pragurile alea să nu se schimbe fără să se uite cineva
 * din nou la imagine.
 */

test("măsura e cea cerută de rețelele sociale", () => {
  assert.deepEqual(MARIMEA_CARTONASULUI, { width: 1200, height: 630 });
});

test("numele lung se scrie mai mic decât cel scurt", () => {
  const scurt = marimeaNumelui("Ana Pop");
  const mediu = marimeaNumelui("Cabinet de Psihologie Ana Pop");
  const lung = marimeaNumelui("C".repeat(120));

  assert.ok(scurt > mediu, "cel mediu ar trebui scris mai mic decât cel scurt");
  assert.ok(mediu > lung, "cel lung ar trebui scris mai mic decât cel mediu");
});

test("chiar și la limita de 120 de caractere rămâne o măsură lizibilă", () => {
  // Sub 40px pe 1200x630 devine ilizibil în previzualizarea de pe telefon.
  assert.ok(marimeaNumelui("C".repeat(120)) >= 40);
});
