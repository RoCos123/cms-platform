import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Proba secțiunilor cu date goale. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. `creeaza_client` provizionează un site cu TOATE cele
 * paisprezece secțiuni aprinse și cu `{}` în fiecare (migrarea
 * `comutator_lansare`: un site nepublicat nu se vede oricum, iar clientul
 * stinge ce nu-i trebuie). Deci fiecare componentă de secțiune primește, în
 * ziua întâi a fiecărui client, date fără niciun câmp.
 *
 * Șase dintre ele făceau `data.ceva.map(...)` de-a dreptul. Prima pagină a
 * primului site provizionat a căzut cu 500 — „Cannot read properties of
 * undefined (reading 'map')" — și nu doar prima pagină: cadrul e comun, deci
 * tot site-ul public. Două aveau chiar și o pază, `data.ceva.length === 0`,
 * care pica exact la fel: `.length` pe `undefined` aruncă la fel ca `.map`.
 *
 * Tipurile nu prind asta: `data` e turnat cu `as` din JSON-ul din bază, deci
 * TypeScript crede că listele există. Nici lintul, nici build-ul.
 *
 * REGULA: în componentele site-ului, o listă din `data` se ia o singură dată,
 * cu `?? []`, într-o variabilă locală. Nu se atinge niciodată `data.x.map` sau
 * `data.x.length` de-a dreptul — nici măcar păzit cu `&&`, ca regula să n-aibă
 * excepții de ținut minte.
 */

function fisiere(radacina) {
  return readdirSync(radacina).flatMap((nume) => {
    const cale = path.join(radacina, nume);
    if (statSync(cale).isDirectory()) return fisiere(cale);
    return /\.tsx?$/.test(nume) ? [cale] : [];
  });
}

test("nicio componentă de site nu umblă direct pe o listă din `data`", () => {
  const gresite = [];

  for (const cale of fisiere("src/components/site")) {
    const sursa = readFileSync(cale, "utf8");
    for (const potrivire of sursa.matchAll(/\bdata\.([a-zA-Z]+)\.(map|length|forEach|filter|slice)\b/g)) {
      const linie = sursa.slice(0, potrivire.index).split("\n").length;
      gresite.push(`${cale}:${linie} → ${potrivire[0]}`);
    }
  }

  assert.deepEqual(
    gresite,
    [],
    "\n  " +
      gresite.join("\n  ") +
      "\n\n  Ia lista o dată, cu `const x = data.x ?? [];`, și folosește `x`.\n" +
      "  Pe un site abia provizionat, `data` e `{}` — iar asta cade cu 500.\n",
  );
});
