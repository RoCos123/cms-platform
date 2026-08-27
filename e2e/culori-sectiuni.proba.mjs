import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Proba culorilor din secțiunile site-ului. Se rulează cu `pnpm test:logica`.
 *
 * De ce există: o variabilă CSS inventată nu dă nicio eroare. `var(--s-chenar)`
 * pur și simplu nu se aplică, iar cartonașul rămâne fără chenar sau textul fără
 * culoare — se vede doar dacă cineva se uită la imagine, pe tema potrivită.
 *
 * S-a întâmplat de două ori într-o zi: `--s-text-pe-accent` la butoanele de oră
 * (text închis pe fundal închis) și `--s-chenar` la cartonașele de programare.
 * Ambele prinse cu ochiul, din noroc.
 */

/** Ce pune `Section` pe elementul ei. Sursa: src/components/site/section.tsx. */
const CUNOSCUTE = new Set([
  "--s-accent",
  "--s-buton-fundal",
  "--s-buton-text",
  "--s-eroare",
  "--s-text-secundar",
]);

function fisiere(radacina) {
  return readdirSync(radacina).flatMap((nume) => {
    const cale = path.join(radacina, nume);
    if (statSync(cale).isDirectory()) return fisiere(cale);
    return /\.tsx?$/.test(nume) ? [cale] : [];
  });
}

test("nicio secțiune nu folosește o variabilă --s- inexistentă", () => {
  const gresite = [];

  for (const cale of [...fisiere("src/components/site"), ...fisiere("src/app/programare")]) {
    const text = readFileSync(cale, "utf8");
    for (const potrivire of text.matchAll(/var\((--s-[a-z0-9-]+)/g)) {
      if (!CUNOSCUTE.has(potrivire[1])) gresite.push(`${cale}: ${potrivire[1]}`);
    }
  }

  assert.deepEqual(
    gresite,
    [],
    `variabile care nu sunt puse de Section, deci nu se aplică:\n  ${gresite.join("\n  ")}`,
  );
});

test("lista de mai sus chiar e cea din Section", () => {
  // Dacă cineva adaugă o variabilă în `Section` și uită s-o treacă aici, testul
  // de sus ar începe să dea alarme false. Verificarea merge în ambele sensuri.
  const sursa = readFileSync("src/components/site/section.tsx", "utf8");
  const puse = new Set([...sursa.matchAll(/\["(--s-[a-z0-9-]+)" as string\]/g)].map((m) => m[1]));

  assert.deepEqual([...puse].sort(), [...CUNOSCUTE].sort());
});
