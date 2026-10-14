import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MAX_CUVINTE_BANDA,
  MAX_LUNGIME_CUVANT_BANDA,
  numeleDinBanda,
} from "@/lib/banda-servicii";
import { catreEditor, catreStocare, valideaza } from "@/lib/sectiuni-editare";
import { metaSectiune } from "@/lib/sectiuni";

/**
 * Banda cu servicii: cuvinte proprii, cu rezervă pe numele serviciilor.
 * `pnpm test:logica`.
 *
 * Cerut de proprietar pe 14 oct. 2026: un client vrea la Servicii „Consiliere
 * psihologică, Testare", dar în bandă „Traumă, Anxietate, Dezvoltare personală".
 * Până atunci banda nu avea câmpuri și derula titlurile serviciilor.
 *
 * Ce apără:
 * 1. LISTA GOALĂ = comportamentul de dinainte. Toate site-urile existente au `{}`
 *    în bandă; dacă „gol" ar însemna altceva, ele și-ar pierde banda fără nicio
 *    migrare care s-o explice;
 * 2. cuvintele proprii câștigă, curățate (spații, rânduri goale, valori care nu
 *    sunt text — conținutul vine din JSON, nu din tipuri);
 * 3. limitele (12 cuvinte, 40 de caractere) se verifică pe server, nu doar în panou;
 * 4. componenta și registrul chiar folosesc regula, nu o copie a ei.
 */

const serviciile = [{ titlu: "Consiliere psihologică" }, { titlu: "Testare" }];

test("fără cuvinte proprii, banda arată numele serviciilor, ca înainte", () => {
  for (const gol of [undefined, null, [], [""], ["  ", "\n"], "Traumă", 7, {}, [null, 3, {}]]) {
    assert.deepEqual(numeleDinBanda(gol, serviciile), ["Consiliere psihologică", "Testare"], JSON.stringify(gol));
  }
});

test("cu cuvinte proprii, banda arată DOAR cuvintele, în ordinea scrisă", () => {
  assert.deepEqual(numeleDinBanda(["Traumă", "Anxietate", "Dezvoltare personală"], serviciile), [
    "Traumă",
    "Anxietate",
    "Dezvoltare personală",
  ]);
});

test("cuvintele se curăță: spații la capete, rânduri goale și ce nu e text dispar", () => {
  assert.deepEqual(numeleDinBanda(["  Traumă ", "", "   ", 5, null, "Anxietate"], serviciile), ["Traumă", "Anxietate"]);
});

test("cuvinte proprii și niciun serviciu publicat: banda tot se vede", () => {
  assert.deepEqual(numeleDinBanda(["Traumă"], []), ["Traumă"]);
});

test("nici cuvinte, nici servicii: nu rămâne nimic de arătat (banda dispare)", () => {
  assert.deepEqual(numeleDinBanda(undefined, []), []);
  assert.deepEqual(numeleDinBanda([], [{ titlu: "  " }, { titlu: undefined }]), []);
});

/** Secțiunea în forma pe care o ține formularul, cu lista de cuvinte dată. */
function valideazaBanda(cuvinte) {
  const meta = metaSectiune("bandaServicii");
  const valoare = catreEditor({}, meta.campuri);
  valoare.cuvinte = cuvinte;
  return valideaza(valoare, meta.campuri);
}

test("secțiunea are câmpul „cuvinte”, opțional, cu limitele din bandă", () => {
  const camp = metaSectiune("bandaServicii").campuri.find((c) => c.cheie === "cuvinte");
  assert.ok(camp, "lipsește câmpul „cuvinte”");
  assert.equal(camp.tip, "listaText");
  assert.equal(camp.max, MAX_CUVINTE_BANDA);
  assert.equal(camp.maxLungimeElement, MAX_LUNGIME_CUVANT_BANDA);
  assert.ok(!camp.obligatoriu, "lista de cuvinte nu are voie să fie obligatorie: goală înseamnă „numele serviciilor”");
  assert.deepEqual(valideazaBanda([]), {});
  assert.deepEqual(valideazaBanda([""]), {});
});

test("limitele: 12 cuvinte și 40 de caractere trec, 13 și 41 nu", () => {
  const cuvinte = (n) => Array.from({ length: n }, (_, i) => `Cuvânt ${i + 1}`);
  assert.deepEqual(valideazaBanda(cuvinte(MAX_CUVINTE_BANDA)), {});
  assert.match(valideazaBanda(cuvinte(MAX_CUVINTE_BANDA + 1)).cuvinte, /Cel mult 12 rânduri/);

  assert.deepEqual(valideazaBanda(["a".repeat(MAX_LUNGIME_CUVANT_BANDA)]), {});
  assert.match(
    valideazaBanda(["Traumă", "a".repeat(MAX_LUNGIME_CUVANT_BANDA + 1)]).cuvinte,
    /cel mult 40 de caractere/,
  );
  // Spațiile de la capete nu contează la lungime — se taie oricum la salvare.
  assert.deepEqual(valideazaBanda([`  ${"a".repeat(MAX_LUNGIME_CUVANT_BANDA)}  `]), {});
});

test("limita de lungime nu se aplică listelor care n-o cer (paragrafele din „Despre mine”)", () => {
  const meta = metaSectiune("aboutTeaser");
  const paragrafe = meta.campuri.find((c) => c.cheie === "paragrafe");
  assert.equal(paragrafe.maxLungimeElement, undefined);
  const valoare = catreEditor({ titlu: "Despre mine", paragrafe: ["x".repeat(500)] }, meta.campuri);
  assert.equal(valideaza(valoare, meta.campuri).paragrafe, undefined);
});

test("la salvare, lista goală nu lasă nicio cheie în date; cea completă se păstrează curată", () => {
  const meta = metaSectiune("bandaServicii");
  const gol = catreEditor({}, meta.campuri);
  assert.deepEqual(catreStocare(gol, meta.campuri), {}, "o bandă fără cuvinte rămâne `{}`, ca la site-urile de acum");

  const plin = catreEditor({ cuvinte: [" Traumă ", "", "Anxietate"] }, meta.campuri);
  assert.deepEqual(catreStocare(plin, meta.campuri), { cuvinte: ["Traumă", "Anxietate"] });
});

test("registrul pasează cuvintele către bandă, iar banda folosește regula, nu o copie", () => {
  const registru = readFileSync("src/components/site/render-sections.tsx", "utf8");
  assert.match(registru, /<BandaServicii[\s\S]*?cuvinte=\{\(row\.data as \{ cuvinte\?: unknown \} \| null\)\?\.cuvinte\}/);

  const banda = readFileSync("src/components/site/sections/banda-servicii.tsx", "utf8");
  assert.ok(banda.includes("numeleDinBanda(cuvinte, servicii)"), "banda trebuie să ia numele din `numeleDinBanda`");
  assert.ok(!banda.includes("servicii.map"), "banda nu mai citește titlurile serviciilor pe cont propriu");
});
