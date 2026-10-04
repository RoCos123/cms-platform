import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { getTemplate } from "@/lib/templates";

/**
 * Bulinele de peste poza din hero plutesc ușor sus-jos. `pnpm test:logica`.
 *
 * Cerut de proprietar pe 4 oct. 2026, arătând Căldură, „ca la Dragoș Geamănă".
 * Măsurat pe pagină: mișcare de 8px, cele două buline în momente diferite; cu
 * „mai puțină mișcare" cerută din sistem, stau pe loc.
 */

test("aprins doar la Căldură, unde s-a cerut", () => {
  assert.equal(getTemplate("caldura").asezari.heroBulinePlutitoare, true);
  for (const id of ["liniste", "lumina", "apropiere", "claritate"]) {
    assert.ok(!getTemplate(id).asezari.heroBulinePlutitoare, `${id} nu are buline plutitoare`);
  }
});

test("mișcarea respectă „mai puțină mișcare” și nu mută nimic din jur", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const bloc = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference) {\n  .bulina-plutitoare"));

  assert.ok(bloc.length > 0, "animația stă sub `prefers-reduced-motion: no-preference`");
  assert.match(css, /@keyframes plutire-bulina[\s\S]*?translateY\(-8px\)/);
});

test("steagul ajunge de la șablon la bulină", () => {
  assert.match(
    readFileSync("src/components/site/render-sections.tsx", "utf8"),
    /bulinePlutitoare=\{ctx\.asezari\.heroBulinePlutitoare\}/,
  );
  assert.match(
    readFileSync("src/components/site/sections/hero.tsx", "utf8"),
    /className=\{plutitoare \? "bulina-plutitoare" : undefined\}/,
  );
});

test("bulinele n-au câmp de emoji și nu desenează unul (scos pe 4 oct. 2026)", async () => {
  // Proprietarul n-a înțeles cum se pune un emoji, iar `:)` apărea ca atare pe
  // poză. Scos din panou ȘI din randare: un emoji rămas în conținutul vechi nu
  // mai apare.
  const { metaSectiune } = await import("@/lib/sectiuni");
  const buline = metaSectiune("hero").campuri.find((c) => c.cheie === "bulinePoza");
  assert.deepEqual(buline.campuri.map((c) => c.cheie), ["mic", "mare"]);
  assert.doesNotMatch(readFileSync("src/components/site/sections/hero.tsx", "utf8"), /bulina\.emoji/);
});
