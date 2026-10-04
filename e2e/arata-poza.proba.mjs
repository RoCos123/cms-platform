import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { tintaDerulare } from "@/lib/arata-poza";

/**
 * Previzualizarea aduce în vedere poza pe care o așezi. `pnpm test:logica`.
 *
 * DE CE EXISTĂ. La Căldură, hero-ul are titlul mare și poza lată dedesubt; pe
 * ecran lat previzualizarea ieșea mai înaltă decât ecranul și, lipită sus,
 * ascundea tocmai poza. Proprietarul trăgea de ea în formular fără s-o vadă
 * (4 oct. 2026). Măsurat pe drumul complet după reparație: la apăsarea pe ramă,
 * poza a trecut de la 60% vizibilă la 100%, deasupra barei de salvare.
 */

test("poza deja întreagă în fereastră: nu se derulează nimic", () => {
  assert.equal(tintaDerulare({ sus: 100, inaltime: 200, derulareAcum: 0, inaltimeFereastra: 600 }), null);
});

test("poza tăiată jos: se centrează în fereastră", () => {
  // Poza de la 500 la 900, fereastra vede 0–600 → centrul pozei (700) ajunge la mijloc (300).
  assert.equal(tintaDerulare({ sus: 500, inaltime: 400, derulareAcum: 0, inaltimeFereastra: 600 }), 400);
});

test("poza deasupra ferestrei: urcă înapoi, nu sub zero", () => {
  assert.equal(tintaDerulare({ sus: 0, inaltime: 100, derulareAcum: 300, inaltimeFereastra: 600 }), 0);
});

test("poza mai înaltă decât fereastra: i se aliniază începutul", () => {
  assert.equal(tintaDerulare({ sus: 800, inaltime: 900, derulareAcum: 0, inaltimeFereastra: 600 }), 800);
});

test("legăturile: rama cere, poza e marcată, previzualizarea ascultă și se derulează", () => {
  const rama = readFileSync("src/components/ui/repozitionare-imagine.tsx", "utf8");
  const poza = readFileSync("src/components/site/section-image.tsx", "utf8");
  const panou = readFileSync("src/components/dashboard/panou-previzualizare.tsx", "utf8");
  const bara = readFileSync("src/components/ui/save-bar.tsx", "utf8");

  // La apăsare, la săgeți și la „Mărime".
  assert.equal(rama.match(/cereSaSeVadaPoza\(src\)/g)?.length, 3);
  assert.match(poza, /data-poza=\{src\}/);
  assert.match(panou, /addEventListener\(EVENIMENT_ARATA_POZA/);
  // Fereastra nu mai trece de ecran și se derulează în interior.
  assert.match(panou, /overflow-y-auto/);
  assert.doesNotMatch(panou, /lg:overflow-visible/);
  // Bara de salvare e ținută în seamă.
  assert.match(bara, /data-bara-salvare/);
  assert.match(panou, /\[data-bara-salvare\]/);
});
