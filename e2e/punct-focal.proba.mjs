import assert from "node:assert/strict";
import test from "node:test";
import {
  PUNCT_FOCAL_IMPLICIT,
  dupaTragere,
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

test("tras de imagine: pe axa cu surplus, procentul se mișcă invers deplasării", () => {
  // Imaginea iese cu 200px pe orizontală. Trasă 100px la dreapta, de la centru,
  // dezvelește stânga: 50 − (100/200)·100 = 0.
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: 100, dy: 0, surplusX: 200, surplusY: 0 }),
    { x: 0, y: 50 },
  );
  // Trasă la stânga, spre dreapta imaginii: 50 + 50 = 100.
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: -100, dy: 0, surplusX: 200, surplusY: 0 }),
    { x: 100, y: 50 },
  );
});

test("fără surplus pe o axă, procentul de pe ea nu se clintește", () => {
  // Imaginea încape fix pe ambele axe: n-ai ce repoziționa, oricât ai trage.
  assert.deepEqual(
    dupaTragere({ x: 30, y: 70 }, { dx: 80, dy: 80, surplusX: 0, surplusY: 0 }),
    { x: 30, y: 70 },
  );
});

test("tragerea se oprește la margini (0–100)", () => {
  // 50 − (80/100)·100 = −30 → adus la 0.
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: 0, dy: 80, surplusX: 0, surplusY: 100 }),
    { x: 50, y: 0 },
  );
});

/*
 * Mărirea pozei (1 oct. 2026). Fără ea, `object-fit: cover` potrivește fix una
 * dintre axe, iar pe aia surplusul e zero — poza nu se poate trage deloc în
 * acea direcție. Proprietarul avea o poză lată într-o ramă verticală și nu
 * putea s-o miște sus-jos; nimic nu-i spunea de ce, fiindcă nu era nimic de
 * spus: deasupra și dedesubt nu exista nimic.
 */
const { surplusulPozei, normalizeazaZoom, scaraImaginii } = await import("@/lib/punct-focal");

// Poză lată (1500×1000) în rama verticală de la „Despre mine" (4/5).
const LATA_IN_RAMA_INALTA = {
  latimeRama: 380,
  inaltimeRama: 475,
  latimeFisier: 1500,
  inaltimeFisier: 1000,
};

test("nemărită, o poză lată n-are ce muta pe verticală", () => {
  const { surplusX, surplusY } = surplusulPozei(LATA_IN_RAMA_INALTA);

  assert.ok(surplusX > 0, "pe orizontală trebuie să prisosească");
  assert.equal(Math.round(surplusY), 0, "pe verticală nu există nimic de adus în cadru");
});

test("mărită, aceeași poză se poate mișca în amândouă direcțiile", () => {
  const { surplusX, surplusY } = surplusulPozei({ ...LATA_IN_RAMA_INALTA, zoom: 1.5 });

  assert.ok(surplusX > 0);
  assert.ok(surplusY > 0, "asta e chiar rostul măririi");
});

test("mărirea se curăță: lipsă, text sau peste limită", () => {
  assert.equal(normalizeazaZoom(undefined), 1);
  assert.equal(normalizeazaZoom("2"), 1);
  assert.equal(normalizeazaZoom(Number.NaN), 1);
  assert.equal(normalizeazaZoom(0.2), 1, "sub 1 ar lăsa rama goală pe margini");
  assert.equal(normalizeazaZoom(99), 3);
  assert.equal(normalizeazaZoom(1.234), 1.23);
});

test("fără mărire nu se pune niciun transform", () => {
  assert.equal(scaraImaginii({ x: 50, y: 50 }), undefined);
  assert.equal(scaraImaginii({ x: 50, y: 50, zoom: 1 }), undefined);
  assert.equal(scaraImaginii({ x: 50, y: 50, zoom: 1.5 }), "scale(1.5)");
});

test("tragerea nu pierde mărirea", () => {
  const dupa = dupaTragere(
    { x: 50, y: 50, zoom: 1.5 },
    { dx: -40, dy: -40, surplusX: 200, surplusY: 200 },
  );

  assert.equal(dupa.zoom, 1.5);
  assert.ok(dupa.x > 50 && dupa.y > 50);
});
