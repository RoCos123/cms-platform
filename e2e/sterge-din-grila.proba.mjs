import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * „X"-ul de ștergere de pe miniaturile din Bibliotecă. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 5 oct. 2026: ștergerea unei poze să nu mai ceară
 * deschiderea ei întâi. Ce ține proba: că „X"-ul nu șterge NICIODATĂ pe loc —
 * trece prin același dialog ca butonul din panou, cel care spune că o poză
 * folosită pe site e scoasă și de acolo — și că cele două locuri nu pot ajunge
 * să aibă dialoguri diferite. Verificat pe pagină, cu server fals: clic pe „X"
 * pe o poză folosită → avertizarea apare, „Păstrează" nu șterge nimic, iar
 * „Șterge definitiv" o scoate din bază și din grilă.
 */

const galerie = readFileSync("src/app/dashboard/imagini/galerie.tsx", "utf8");
const panou = readFileSync("src/app/dashboard/imagini/panou-imagine.tsx", "utf8");
const dialog = readFileSync("src/app/dashboard/imagini/dialog-stergere-imagine.tsx", "utf8");

test("fiecare miniatură are „X”, ca frate al butonului cardului (nu copil)", () => {
  assert.match(galerie, /aria-label=\{`Șterge imaginea \$\{imagine\.numeFisier\}`\}/);
  // Un buton în alt buton e HTML invalid: „X"-ul vine DUPĂ închiderea cardului.
  const dupaCard = galerie.slice(galerie.indexOf("</button>\n\n                    {/*"));
  assert.match(dupaCard, /setDeStersId\(imagine\.id\)/);
});

test("„X” nu șterge pe loc: deschide dialogul comun", () => {
  assert.doesNotMatch(galerie, /stergeImaginea\(/);
  assert.match(galerie, /<DialogStergereImagine/);
});

test("butonul din panou și „X” folosesc ACELAȘI dialog", () => {
  assert.match(panou, /<DialogStergereImagine/);
  assert.doesNotMatch(panou, /<ConfirmDialog/);
  assert.doesNotMatch(panou, /stergeImaginea/);
  // Dialogul comun e singurul care apelează acțiunea și avertizează despre folosiri.
  assert.match(dialog, /stergeImaginea\(imagine\.id\)/);
  assert.match(dialog, /O scoatem și de acolo/);
});

test("ștergerea scoate poza și din selecție", () => {
  assert.match(galerie, /if \(id === alesId\) setAlesId\(null\)/);
});
