import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Proba pentru ce se cheamă din `after()`. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. `after()` mută o treabă după ce răspunsul a plecat spre
 * vizitator — bun pentru statistici, care n-au de ce să încetinească pagina.
 * Dar acolo cererea nu mai există: `headers()` și `cookies()` aruncă, iar
 * Next răspunde 500 pentru pagina ÎNTREAGĂ.
 *
 * S-a întâmplat pe prima pagină a primului site provizionat, în producție.
 * Funcția de numărare prindea eroarea și o scria frumos în jurnal — și tot
 * cădea pagina, fiindcă Next o vede înainte de `catch`. Panoul mergea, deci
 * părea o problemă de publicare; era o problemă de statistici. S-a găsit abia
 * în jurnalele Vercel.
 *
 * Regula, deci: ce se cheamă din `after()` primește valori, nu citește cererea.
 * Interzise sunt `next/headers` și `@/lib/dal` — a doua le folosește pe primele
 * (`getTenant`, `getSesiuneOptionala`), deci ar aduce aceeași cădere pe ușa din
 * dos.
 *
 * Verificarea e pe surse: Node nu rulează JSX, deci componentele nu pot fi
 * montate. Prinde forma obișnuită — `after(f)` și `after(() => f(...))` — nu
 * orice fel de indirectare. O plasă care prinde cazul real, nu una perfectă.
 */

const INTERZISE = ['from "next/headers"', 'from "@/lib/dal"'];

function fisiere(radacina) {
  return readdirSync(radacina).flatMap((nume) => {
    const cale = path.join(radacina, nume);
    if (statSync(cale).isDirectory()) return fisiere(cale);
    return /\.tsx?$/.test(nume) ? [cale] : [];
  });
}

/** Fișierul în care e definit `nume`, dacă e importat dintr-un `@/...`. */
function unde(sursa, nume) {
  const imp = sursa.match(
    new RegExp(`import\\s*\\{[^}]*\\b${nume}\\b[^}]*\\}\\s*from\\s*"@/([^"]+)"`),
  );
  if (!imp) return null;
  for (const sufix of [".ts", ".tsx", "/index.ts"]) {
    const cale = `src/${imp[1]}${sufix}`;
    if (existsSync(cale)) return cale;
  }
  return null;
}

test("ce se cheamă din after() nu atinge cererea", () => {
  const gresite = [];
  let gasiteApeluri = 0;

  for (const cale of fisiere("src")) {
    const sursa = readFileSync(cale, "utf8");
    // Doar fișierele care chiar importă `after`, ca să nu se ia după alt cuvânt.
    if (!/import\s*\{[^}]*\bafter\b[^}]*\}\s*from\s*"next\/server"/.test(sursa)) continue;

    for (const potrivire of sursa.matchAll(/\bafter\(\s*(?:\(\)\s*=>\s*)?(\w+)\s*[(),]/g)) {
      const nume = potrivire[1];
      gasiteApeluri += 1;

      const definit = unde(sursa, nume);
      assert.ok(definit, `${cale}: after(${nume}) — nu găsesc de unde se importă \`${nume}\``);

      const tinta = readFileSync(definit, "utf8");
      for (const interzis of INTERZISE) {
        if (tinta.includes(interzis)) {
          gresite.push(`${definit} (chemat din ${cale} prin after) importă ${interzis}`);
        }
      }
    }
  }

  // Dacă tiparul de căutare nu mai prinde nimic, proba ar trece degeaba.
  assert.ok(gasiteApeluri > 0, "n-am găsit niciun apel `after(...)` — s-a schimbat forma?");

  assert.deepEqual(
    gresite,
    [],
    `\n  ${gresite.join("\n  ")}\n\n  Citește valorile în componentă și dă-le ca argument.\n`,
  );
});
