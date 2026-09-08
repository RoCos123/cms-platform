import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * Proba textului de pornire. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Un site nou trebuie să-și arate scheletul: fiecare secțiune cu
 * numele ei, ca text de pornire, ca omul să vadă ce are de completat. Textele
 * alea sunt scrise în SQL, în `textul_de_pornire` — al patrulea loc unde
 * trăiește lista de secțiuni, după registrul de componente, metaSectiune și
 * constrângerea din tabel.
 *
 * Al patrulea loc nu se vede din primele trei. O secțiune nouă adăugată în cod
 * ar fi provizionată cu `{}`, deci n-ar apărea pe site — iar panoul ar spune
 * iar „vizibilă". Fără proba asta nimeni n-ar afla până la primul client care
 * o observă, cum s-a întâmplat deja o dată.
 */

const SQL = "supabase/migrations/20260908170000_schelet_la_provizionare.sql";

test("fiecare secțiune din registru primește text de pornire", () => {
  const registru = readFileSync("src/components/site/render-sections.tsx", "utf8");
  const corp = registru.slice(registru.indexOf("const REGISTRU"), registru.indexOf("export function sectiuneCunoscuta"));
  const chei = [...corp.matchAll(/^\s{2}(\w+):\s*\(row/gm)].map((m) => m[1]);
  assert.ok(chei.length > 10, `am găsit doar ${chei.length} chei în registru — s-a schimbat forma?`);

  const sql = readFileSync(SQL, "utf8");
  const inSql = new Set([...sql.matchAll(/when '(\w+)'\s+then/g)].map((m) => m[1]));

  const lipsa = chei.filter((cheie) => !inSql.has(cheie));
  assert.deepEqual(
    lipsa,
    [],
    `\n  Secțiuni fără text de pornire în ${SQL}: ${lipsa.join(", ")}\n` +
      "  Provizionate cu `{}`, n-ar apărea pe site — dar panoul ar spune „vizibilă”.\n",
  );
});

test("textul de pornire poartă numele din panou", () => {
  // Nu toate: `hero` primește numele cabinetului, `contact` are formula lui, iar
  // `quote` n-are titlu, ci citat. Restul trebuie să spună exact ce scrie pe
  // butonul din panou — altfel omul caută pe site o secțiune pe care n-o
  // recunoaște.
  const meta = readFileSync("src/lib/sectiuni.ts", "utf8");
  const sql = readFileSync(SQL, "utf8");

  const gresite = [];
  for (const [, cheie, titlu] of sql.matchAll(/when '(\w+)'\s+then jsonb_build_object\(\s*'titlu',\s*'([^']+)'/g)) {
    if (cheie === "hero" || cheie === "contact") continue;

    const bloc = meta.slice(meta.indexOf(`cheie: "${cheie}"`));
    const nume = bloc.match(/nume:\s*"([^"]+)"/)?.[1];
    if (!nume) continue;

    // Panoul mai pune și lămuriri în paranteză („Despre mine (pe prima pagină)”);
    // pe site n-au ce căuta.
    const asteptat = nume.replace(/\s*\([^)]*\)\s*$/, "");
    if (titlu !== asteptat) gresite.push(`${cheie}: SQL „${titlu}” ≠ panou „${asteptat}”`);
  }

  assert.deepEqual(gresite, [], `\n  ${gresite.join("\n  ")}\n`);
});
