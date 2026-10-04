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

test("fereastra previzualizării nu are bară de derulare pe ecran lat (fără pâlpâit)", () => {
  // Două rânduri de pâlpâit, amândouă prinse de proprietar pe 5 oct. 2026:
  // 1) bara apărea și dispărea la fiecare cadru (lățimea → scara → bara…) —
  //    oprit cu locul barei rezervat pe ecran îngust;
  // 2) în Edge, pâlpâia și la derularea PAGINII peste fereastra derulabilă —
  //    oprit cu `overflow-y: hidden` pe ecran lat: fără bară deloc, ca înainte
  //    de 4 oct., dar tot derulabil DIN COD (`scrollTo` merge pe `hidden`),
  //    deci aducerea pozei în vedere rămâne. Măsurat: poza 27% → 100% vizibilă.
  const panou = readFileSync("src/components/dashboard/panou-previzualizare.tsx", "utf8");
  assert.match(panou, /overflow-y-auto[^"]*\[scrollbar-gutter:stable\]/);
  assert.match(panou, /lg:overflow-y-hidden/);
});

test("fereastra previzualizării se derulează împreună cu pagina", () => {
  // Fără bară proprie (Edge, mai sus), partea de jos a unei secțiuni înalte nu
  // se mai putea vedea deloc: proprietarul a pus a doua bulină, jos pe poză, și
  // n-o vedea nicăieri (5 oct. 2026). Acum fereastra alunecă proporțional cu
  // pagina. Măsurat pe Claritate: la câmpul bulinei a doua, bulina 0% → 100%.
  const panou = readFileSync("src/components/dashboard/panou-previzualizare.tsx", "utf8");
  assert.match(panou, /window\.addEventListener\("scroll", sincronizeaza, \{ passive: true \}\)/);
  assert.match(panou, /window\.scrollY \/ deDerulatPagina\) \* deDerulatFereastra/);
  // Derularea cerută de o poză nu e călcată de sincronizare.
  assert.match(panou, /sincronDupa/);
});
