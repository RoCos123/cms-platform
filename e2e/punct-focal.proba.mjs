import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PUNCT_FOCAL_IMPLICIT,
  SURPLUS_MINIM_MUTARE,
  axaSePoateMuta,
  dupaTragere,
  normalizeazaPunctFocal,
  poateFiMutata,
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

/**
 * „Poza umple tot cadrul" (15 oct. 2026). Proprietarul nu putea muta coperta unui
 * articol: poza era 16/9, rama din editor tot 16/9 — nu ieșea nimic din ea, deci
 * tragerea nu avea ce muta, iar pe poză scria mereu „Trage de poză…". Acum, când
 * nu e nimic de mutat, scrie asta.
 */

/** Rama din editor, așa cum o măsoară browserul: 320×180 cu chenar de 1px → 318×178 înăuntru. */
const rama = { latimeRama: 318, inaltimeRama: 178 };

test("o poză de aceeași formă cu rama, sau aproape, nu se poate muta (tipicele 16/9 și 1,79)", () => {
  for (const [lat, inalt] of [
    [1600, 900],
    [1920, 1080],
    [2752, 1536], // ~1,79 — cum scot de obicei generatoarele de imagini
    [1344, 768], // 7/4
  ]) {
    const surplus = surplusulPozei({ ...rama, latimeFisier: lat, inaltimeFisier: inalt });
    assert.equal(poateFiMutata(surplus), false, `${lat}×${inalt}: ${JSON.stringify(surplus)}`);
  }
});

test("o poză cu altă formă se poate muta, pe axa pe care iese din ramă", () => {
  assert.equal(poateFiMutata(surplusulPozei({ ...rama, latimeFisier: 1600, inaltimeFisier: 1200 })), true); // 4/3
  assert.equal(poateFiMutata(surplusulPozei({ ...rama, latimeFisier: 900, inaltimeFisier: 1200 })), true); // portret
  assert.equal(poateFiMutata(surplusulPozei({ ...rama, latimeFisier: 3000, inaltimeFisier: 900 })), true); // panoramă
});

test("mărită, aceeași poză 16/9 se poate muta — de-aia trimite mesajul la „Mărime”", () => {
  const masuri = { ...rama, latimeFisier: 1600, inaltimeFisier: 900 };
  assert.equal(poateFiMutata(surplusulPozei({ ...masuri, zoom: 1 })), false);
  assert.equal(poateFiMutata(surplusulPozei({ ...masuri, zoom: 1.1 })), true);
  assert.equal(poateFiMutata(surplusulPozei({ ...masuri, zoom: 2 })), true);
});

test("pragul: sub 4 px nu, de la 4 px da, pe oricare axă", () => {
  assert.equal(SURPLUS_MINIM_MUTARE, 4);
  assert.equal(poateFiMutata({ surplusX: 0, surplusY: 0 }), false);
  assert.equal(poateFiMutata({ surplusX: 3.9, surplusY: 3.9 }), false);
  assert.equal(poateFiMutata({ surplusX: 4, surplusY: 0 }), true);
  assert.equal(poateFiMutata({ surplusX: 0, surplusY: 4 }), true);
});

test("mesajul de pe poză: textul proprietarului, cuvânt cu cuvânt, iar „Mărime” e chiar eticheta glisorului", () => {
  const componenta = readFileSync("src/components/ui/repozitionare-imagine.tsx", "utf8");
  assert.ok(
    componenta.includes('"Poza umple tot cadrul. Mărește-o din «Mărime» ca s-o poți muta."'),
    "textul cerut de proprietar s-a schimbat",
  );
  assert.ok(componenta.includes("<span className=\"shrink-0\">Mărime</span>"), "glisorul nu se mai numește „Mărime”");
  // Unde nu e glisor (Biblioteca), mesajul nu trimite la un buton care nu există.
  assert.ok(componenta.includes("cuMarire ? INDICIU_UMPLE_CU_MARIRE : INDICIU_UMPLE"));
  assert.ok(componenta.includes('"Trage de poză ca s-o poziționezi"'), "indiciul obișnuit trebuie să rămână");
});

/**
 * Pragul și la tragere (15 oct. 2026, „da" al proprietarului). Pe o poză cu 1–3 px de
 * surplus, orice tragere împărțea la un număr aproape de zero și arunca poziția
 * salvată la 0% sau 100% — deși pe ecran nu se mișca nimic. Poziția se folosește și
 * pe cartonașul din listă, care are altă formă, deci acolo extremul se vedea.
 */

test("pe o axă cu surplus sub prag (0,9 / 2,5 / 2,9 px), tragerea NU mută poziția salvată", () => {
  // Cele trei valori reale: 16/9 într-o ramă cu chenar (0,9), ~1,79 (2,5), 7/4 (2,9).
  for (const surplus of [0.875, 2.5, 2.857142857142833, SURPLUS_MINIM_MUTARE - 0.01]) {
    assert.deepEqual(
      dupaTragere({ x: 50, y: 50 }, { dx: 60, dy: 40, surplusX: surplus, surplusY: surplus }),
      { x: 50, y: 50 },
      `surplus ${surplus}`,
    );
    assert.deepEqual(
      dupaTragere({ x: 20, y: 80 }, { dx: -300, dy: 300, surplusX: surplus, surplusY: surplus }),
      { x: 20, y: 80 },
      `surplus ${surplus}, tras tare`,
    );
  }
});

test("de la prag în sus, tragerea mută, proporțional cu surplusul", () => {
  assert.ok(axaSePoateMuta(SURPLUS_MINIM_MUTARE));
  assert.ok(!axaSePoateMuta(SURPLUS_MINIM_MUTARE - 0.01));
  // 4 px de surplus, tras 2 px: jumătate din drum → 50 − 50 = 0.
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: 2, dy: 0, surplusX: SURPLUS_MINIM_MUTARE, surplusY: 0 }),
    { x: 0, y: 50 },
  );
});

test("fiecare axă își are pragul ei: una fără joc stă pe loc, cealaltă se mișcă", () => {
  // 2752×1536 în rama 16/9: 2,5 px pe orizontală, 0 pe verticală — și 4/3: 0 pe orizontală, 60 pe verticală.
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: 30, dy: 30, surplusX: 0, surplusY: 60 }),
    { x: 50, y: 0 },
  );
  assert.deepEqual(
    dupaTragere({ x: 50, y: 50 }, { dx: 30, dy: 30, surplusX: 2.5, surplusY: 60 }),
    { x: 50, y: 0 },
    "2,5 px pe orizontală nu trebuie să mute x",
  );
});

test("și săgețile respectă pragul, nu doar mausul", () => {
  const componenta = readFileSync("src/components/ui/repozitionare-imagine.tsx", "utf8");
  assert.ok(componenta.includes("axaSePoateMuta(surplusX) ? value.x + m[0] : value.x"));
  assert.ok(componenta.includes("axaSePoateMuta(surplusY) ? value.y + m[1] : value.y"));
  assert.ok(!/surplus[XY] > 0/.test(componenta), "a rămas o verificare „> 0” care ocolește pragul");
});
