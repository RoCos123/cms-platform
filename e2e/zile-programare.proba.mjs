import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * Așezarea zilelor în grila de programare de la Apropiere. `pnpm test:logica`.
 *
 * Prins de proprietar pe 5 oct. 2026: cu șase zile, „Luni" cădea SINGURĂ pe un
 * rând nou, sub celelalte cinci. Cauza: `repeat(auto-fill, minmax(90px, 1fr))` pe
 * o grilă de ~577px încape 5 coloane, nu 6 — iar regula nu știa că 5 + 1 arată
 * prost. Măsurat după reparație, pe pagină, la 1–6 zile și la 1326/1000/390px:
 * 6 zile → 6 pe un rând (laptop), 3 + 3 (telefon); 5 → 5 / 3 + 2; 4 → 4 / 2 + 2;
 * nicio zi singură pe un rând, nicăieri.
 */

const css = readFileSync("src/app/globals.css", "utf8");
const sursa = readFileSync("src/components/site/sections/programare-rapida.tsx", "utf8");

test("grila știe câte zile sunt, în loc de `auto-fill` cu un minim fix", () => {
  assert.match(css, /\.zile-grila \{[^}]*repeat\(var\(--zile, 6\), minmax\(0, 1fr\)\)/);
  assert.match(sursa, /data-zile=\{zile\.length\}/);
  assert.doesNotMatch(sursa, /auto-fill, minmax\(90px/);
});

test("când zilele nu mai încap pe un rând, se împart egal, niciodată 5 + 1", () => {
  // Pragurile: lățimea la care N coloane de ~76px (cu 10px între ele) nu mai încap.
  assert.match(css, /@container zile \(max-width: 505px\) \{\s*\.zile-grila\[data-zile="6"\] \{\s*grid-template-columns: repeat\(3,/);
  assert.match(css, /@container zile \(max-width: 419px\) \{\s*\.zile-grila\[data-zile="5"\] \{\s*grid-template-columns: repeat\(3,/);
  assert.match(css, /@container zile \(max-width: 333px\) \{\s*\.zile-grila\[data-zile="4"\] \{\s*grid-template-columns: repeat\(2,/);
  // Pragul fiecărui N: N × 76 + (N − 1) × 10, minus 1px.
  for (const [n, prag] of [[6, 505], [5, 419], [4, 333]]) {
    assert.equal(n * 76 + (n - 1) * 10 - 1, prag, `${n} zile: pragul ${prag}`);
  }
});

test("containerul e stratul de DEASUPRA grilei (o regulă @container nu stilizează containerul)", () => {
  assert.match(sursa, /containerType: "inline-size"/);
  assert.match(sursa, /containerName: "zile"/);
  // Grila propriu-zisă e copilul containerului, nu containerul însuși.
  assert.match(sursa, /<div style=\{stilGrila\}>\s*<div className="zile-grila"/);
});

test("o zi nu se întinde peste ~140px (cu una-două zile, coloanele rămân coloane)", () => {
  assert.match(css, /max-width: calc\(var\(--zile, 6\) \* 140px \+ \(var\(--zile, 6\) - 1\) \* 10px\)/);
});
