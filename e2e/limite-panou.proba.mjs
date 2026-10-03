import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  EROARE_PREA_MULTE,
  MAXIM_ARTICOLE,
  MAXIM_PAGINI,
  MAXIM_SERVICII,
  mesajLimita,
} from "@/lib/limite-panou";

/**
 * Proba mesajului de limită de la blog, servicii și pagini. `pnpm test:logica`.
 *
 * DE CE EXISTĂ. La limită, „+ Adaugă” trimitea omul înapoi pe listă cu
 * `?eroare=prea-multe` — și nicio pagină de listă nu citea parametrul. Pentru
 * client, butonul părea că nu face nimic (3 oct. 2026). Defectul era o nepotrivire
 * între DOUĂ capete: acțiunea trimitea ceva, pagina nu asculta. Nimic nu cădea,
 * nicio eroare, doar tăcere.
 *
 * Capetele sunt în fișiere diferite, deci ținerea lor laolaltă nu se poate
 * verifica rulând una dintre ele — proxy-ul și paginile cer Supabase. De-aia
 * probele de la sfârșit citesc SURSA și compară: pagina randează mesajul, cu
 * ACEEAȘI limită pe care o verifică acțiunea.
 */

test("mesajul are pluralul corect din română", () => {
  assert.equal(
    mesajLimita(MAXIM_ARTICOLE, "articol", "articole"),
    "Ai ajuns la limita de 500 de articole. Șterge unul ca să poți adăuga altul.",
  );
  assert.equal(
    mesajLimita(MAXIM_SERVICII, "serviciu", "servicii"),
    "Ai ajuns la limita de 40 de servicii. Șterge unul ca să poți adăuga altul.",
  );
  assert.equal(
    mesajLimita(MAXIM_PAGINI, "pagină", "pagini"),
    "Ai ajuns la limita de 50 de pagini. Șterge unul ca să poți adăuga altul.",
  );
});

test("limitele rămân cele hotărâte", () => {
  // Un număr schimbat din greșeală ar muta limita fără ca nimeni să observe.
  assert.deepEqual([MAXIM_ARTICOLE, MAXIM_SERVICII, MAXIM_PAGINI], [500, 40, 50]);
});

const ECRANE = [
  { nume: "blog", maxim: "MAXIM_ARTICOLE", pagina: "BlogPage" },
  { nume: "servicii", maxim: "MAXIM_SERVICII", pagina: "ServiciiPage" },
  { nume: "pagini", maxim: "MAXIM_PAGINI", pagina: "PaginiPage" },
];

for (const { nume, maxim } of ECRANE) {
  const actiuni = readFileSync(`src/app/dashboard/${nume}/actions.ts`, "utf8");
  const pagina = readFileSync(`src/app/dashboard/${nume}/page.tsx`, "utf8");

  test(`${nume}: acțiunea trimite parametrul din sursa comună, nu un șir scris de mână`, () => {
    assert.match(actiuni, /EROARE_PREA_MULTE/);
    assert.doesNotMatch(actiuni, /eroare=prea-multe/, "șirul nu mai are voie scris direct");
    // Limita nu mai e o constantă privată (fișierele „use server” n-ar fi putut-o exporta).
    assert.doesNotMatch(actiuni, new RegExp(`const ${maxim} = `));
  });

  test(`${nume}: pagina citește parametrul și randează mesajul, cu aceeași limită ca acțiunea`, () => {
    assert.match(pagina, /searchParams/, "pagina trebuie să citească parametrii din adresă");
    assert.match(pagina, /<MesajLimita/, "pagina trebuie să randeze mesajul");
    assert.match(
      pagina,
      new RegExp(`maxim=\\{${maxim}\\}`),
      `mesajul trebuie să folosească ${maxim}, aceeași constantă pe care o verifică acțiunea`,
    );
    assert.match(actiuni, new RegExp(`>= ${maxim}`), `acțiunea verifică ${maxim}`);
  });
}

test("o valoare necunoscută în adresă nu produce niciun mesaj inventat", () => {
  const componenta = readFileSync("src/components/dashboard/mesaj-limita.tsx", "utf8");

  // Singura valoare care aprinde mesajul e cea din sursa comună.
  assert.match(componenta, /eroare !== EROARE_PREA_MULTE\) return null/);
  assert.equal(EROARE_PREA_MULTE, "prea-multe");
});
