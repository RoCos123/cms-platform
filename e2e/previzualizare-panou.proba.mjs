import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * Proba previzualizării din panou. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Ecranul de editare a unei secțiuni arată alături formularul și
 * secțiunea desenată cu componenta adevărată de pe site. Toată valoarea lui stă
 * într-o singură promisiune: ce vezi aici e ce ai pe site.
 *
 * Promisiunea s-a rupt o dată, în tăcere. Secțiunea „Serviciile mele" a primit o
 * a doua așezare, ținută pe coloana `variant`; pagina publică o citea, ecranul
 * de editare nu — iar el punea `variant: null` de-a dreptul în rândul de
 * previzualizare. Rezultatul: în panou cartonașe, pe site bandă. Nicio eroare,
 * nicio probă picată; se vedea doar dacă cineva deschidea ambele ecrane.
 *
 * Verificarea de aici e pe surse, nu pe randare: Node nu poate rula JSX, deci
 * componentele nu pot fi montate. Dar întrebarea nu e cum arată — e dacă
 * panoul CITEȘTE tot ce citește site-ul. Asta se vede în cele două interogări.
 */

/** Coloanele din `site_content` care ajung în felul cum ARATĂ secțiunea. */
const CE_TINE_DE_DESEN = ["id", "key", "variant", "tone", "data"];

/** Coloanele care spun unde stă secțiunea, nu cum arată. Panoul n-are nevoie de ele. */
const CE_TINE_DE_LOC = ["visible", "position"];

function coloaneSelectate(cale) {
  const sursa = readFileSync(cale, "utf8");
  const potrivire = sursa.match(/\.select\("((?:id|key)[^"]*)"\)/);
  assert.ok(potrivire, `n-am găsit interogarea din site_content în ${cale}`);
  return potrivire[1].split(",").map((c) => c.trim());
}

const PUBLIC = "src/app/page.tsx";
const PANOU = "src/app/dashboard/sectiuni/[id]/page.tsx";

test("panoul citește toate coloanele de care depinde desenul secțiunii", () => {
  const alSiteului = coloaneSelectate(PUBLIC);
  const alPanoului = coloaneSelectate(PANOU);

  const deDesen = alSiteului.filter((c) => !CE_TINE_DE_LOC.includes(c));
  const lipsa = deDesen.filter((c) => !alPanoului.includes(c));

  assert.deepEqual(
    lipsa,
    [],
    `Site-ul citește coloane pe care ecranul de editare nu le citește: ${lipsa.join(", ")}.\n` +
      `Previzualizarea va arăta altceva decât are clientul pe site.\n` +
      `Adaugă-le în ${PANOU} și trimite-le mai departe către EditorSectiune.`,
  );
});

test("lista de mai sus chiar e cea din interogarea site-ului", () => {
  // Dacă cineva adaugă o coloană în pagina publică și uită s-o treacă într-una
  // dintre cele două liste, proba de sus ar trece degeaba. Verificarea merge în
  // ambele sensuri, ca la culorile secțiunilor.
  const alSiteului = coloaneSelectate(PUBLIC).sort();
  assert.deepEqual(alSiteului, [...CE_TINE_DE_DESEN, ...CE_TINE_DE_LOC].sort());
});

test("previzualizarea nu inventează o așezare", () => {
  // Bugul propriu-zis: rândul de previzualizare era construit cu `variant: null`
  // scris de mână, deci nicio coloană citită n-ar fi ajutat.
  const editor = readFileSync("src/app/dashboard/sectiuni/[id]/editor.tsx", "utf8");
  assert.ok(
    !/variant:\s*null/.test(editor),
    "editor.tsx scrie `variant: null` în rândul de previzualizare, în loc să " +
      "folosească varianta adevărată a secțiunii.",
  );
});
