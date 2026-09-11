import assert from "node:assert/strict";
import test from "node:test";
import {
  PUNCT_FOCAL_IMPLICIT,
  normalizeazaPunctFocal,
  pozitiaImaginii,
} from "@/lib/punct-focal";

/**
 * Proba punctului focal. `pnpm test:logica`.
 *
 * Ce contează aici e că o valoare stricată din conținut NU ajunge niciodată un
 * `object-position` fără sens la vizitator — se întoarce la centru. Randarea în
 * sine (`.tsx`) nu se poate proba cu Node; asta e regula pe care se sprijină.
 */

test("un punct lipsă sau nevalid devine centrul", () => {
  assert.deepEqual(normalizeazaPunctFocal(undefined), PUNCT_FOCAL_IMPLICIT);
  assert.deepEqual(normalizeazaPunctFocal(null), PUNCT_FOCAL_IMPLICIT);
  assert.deepEqual(normalizeazaPunctFocal({}), PUNCT_FOCAL_IMPLICIT);
  assert.deepEqual(normalizeazaPunctFocal({ x: 50 }), PUNCT_FOCAL_IMPLICIT); // y lipsă
  assert.deepEqual(normalizeazaPunctFocal({ x: Number.NaN, y: 10 }), PUNCT_FOCAL_IMPLICIT);
  assert.deepEqual(normalizeazaPunctFocal("30 40"), PUNCT_FOCAL_IMPLICIT);
});

test("valorile bune se păstrează; cele din afara intervalului se aduc în 0–100", () => {
  assert.deepEqual(normalizeazaPunctFocal({ x: 0, y: 0 }), { x: 0, y: 0 });
  assert.deepEqual(normalizeazaPunctFocal({ x: 100, y: 100 }), { x: 100, y: 100 });
  assert.deepEqual(normalizeazaPunctFocal({ x: 30, y: 72 }), { x: 30, y: 72 });
  assert.deepEqual(normalizeazaPunctFocal({ x: 150, y: -20 }), { x: 100, y: 0 });
});

test("procentele se rotunjesc la întreg", () => {
  assert.deepEqual(normalizeazaPunctFocal({ x: 33.333, y: 66.7 }), { x: 33, y: 67 });
});

test("pozitiaImaginii dă un object-position gata de pus în stil", () => {
  assert.equal(pozitiaImaginii(undefined), "50% 50%");
  assert.equal(pozitiaImaginii({ x: 50, y: 50 }), "50% 50%");
  assert.equal(pozitiaImaginii({ x: 20, y: 80 }), "20% 80%");
  // O valoare stricată nu produce CSS stricat: se întoarce la centru.
  assert.equal(pozitiaImaginii({ x: 9999, y: "sus" }), "50% 50%");
});
