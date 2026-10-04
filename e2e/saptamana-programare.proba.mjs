import assert from "node:assert/strict";
import test from "node:test";
import { cheileSaptamanii } from "@/lib/saptamana-programare";

/**
 * Săptămâna Luni–Sâmbătă din grila de programare. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026: „luni trebuie să fie prima, iar ultima zi să
 * fie sâmbăta". Până atunci zilele veneau cronologic, deci cu zilele din captura
 * lui (marți 6 … sâmbătă 10, apoi luni 12) „Luni" ajungea la sfârșit.
 */

test("cazul proprietarului: marți–sâmbătă + luni următoare → săptămâna 5–10 oct., luni prima", () => {
  const libere = ["2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12"];
  assert.deepEqual(cheileSaptamanii(libere), [
    "2026-10-05", // luni — fără ore, estompată
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10", // sâmbătă — ultima
  ]);
});

test("începe mereu într-o zi de luni și se termină într-o sâmbătă", () => {
  for (const libere of [["2026-10-08"], ["2026-10-10"], ["2026-10-12"], ["2026-12-31"], ["2027-01-01"]]) {
    const sapt = cheileSaptamanii(libere);
    assert.equal(sapt.length, 6);
    // 2026-10-05 e luni; zilele dintre două luni diferă prin multipli de 7.
    const luni = Date.UTC(2026, 9, 5);
    const [an, luna, zi] = sapt[0].split("-").map(Number);
    assert.equal(((Date.UTC(an, luna - 1, zi) - luni) / 86400000) % 7, 0, `${sapt[0]} e luni`);
    const [a2, l2, z2] = sapt[5].split("-").map(Number);
    assert.equal((Date.UTC(a2, l2 - 1, z2) - Date.UTC(an, luna - 1, zi)) / 86400000, 5, "sâmbăta e la 5 zile după luni");
  }
});

test("trece de luna din calendar și de an", () => {
  assert.deepEqual(cheileSaptamanii(["2026-09-30"]), [
    "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03",
  ]);
  assert.deepEqual(cheileSaptamanii(["2026-12-31"]), [
    "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02",
  ]);
});

test("ordinea în care vin zilele nu contează", () => {
  assert.deepEqual(
    cheileSaptamanii(["2026-10-12", "2026-10-10", "2026-10-06"]),
    cheileSaptamanii(["2026-10-06", "2026-10-10", "2026-10-12"]),
  );
});

test("o zi liberă luni își are locul primul, fără săptămâna dinainte", () => {
  assert.deepEqual(cheileSaptamanii(["2026-10-12", "2026-10-13"])[0], "2026-10-12");
});

test("duminica nu intră în grilă și nu alege singură o săptămână", () => {
  // 2026-10-11 e duminică. Singură, nu dă nicio săptămână Luni–Sâmbătă.
  assert.deepEqual(cheileSaptamanii(["2026-10-11"]), []);
  // Cu o duminică (11) și o zi din săptămâna următoare (14), se alege săptămâna 12–17,
  // nu cea care se termină duminică.
  assert.deepEqual(cheileSaptamanii(["2026-10-11", "2026-10-14"])[0], "2026-10-12");
});

test("fără nicio zi liberă: listă goală (grila cade pe lista simplă)", () => {
  assert.deepEqual(cheileSaptamanii([]), []);
});

import { readFileSync } from "node:fs";

test("cablarea: serverul construiește săptămâna, o trece prin context, iar grila o afișează", () => {
  const server = readFileSync("src/lib/programari-publice.ts", "utf8");
  const render = readFileSync("src/components/site/render-sections.tsx", "utf8");
  const sectiune = readFileSync("src/components/site/sections/programare.tsx", "utf8");
  const grila = readFileSync("src/components/site/sections/programare-rapida.tsx", "utf8");

  assert.match(server, /cheileSaptamanii\(zile\.map\(\(z\) => z\.zi\)\)/);
  assert.match(server, /\.\.\.\(saptamana\.length > 0 && \{ saptamana \}\)/);
  assert.match(render, /zileSaptamana=\{ctx\.oreProgramare\.saptamana\}/);
  assert.match(sectiune, /zileSaptamana=\{zileSaptamana\}/);
  assert.match(grila, /const zileAfisate = zileSaptamana \?\? zile\.slice\(0, 6\)/);
});

test("zilele fără ore rămân în coloană, estompate, iar „Vezi toate” numără doar zilele cu ore", () => {
  const grila = readFileSync("src/components/site/sections/programare-rapida.tsx", "utf8");
  assert.match(grila, /z\.ore\.length === 0 \? \{ opacity: 0\.5 \}/);
  assert.match(grila, /maiSunt=\{zile\.length > afisateCuOre\}/);
});
