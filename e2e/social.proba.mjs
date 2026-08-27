import assert from "node:assert/strict";
import test from "node:test";
import { linkurileSociale } from "@/lib/setari";
import { esteAdresaExterna } from "@/lib/sectiuni-editare";
import { dateleCabinetului, datelePsihologului } from "@/lib/date-structurate";

/**
 * Proba profilurilor de pe rețele. Se rulează cu `pnpm test:logica`.
 *
 * Miza: adresele astea ajung în `sameAs`, adică într-o afirmație către Google
 * despre cine e cine. Una greșită nu produce doar un link mort în subsol.
 */

test("o adresă relativă nu e adresă externă", () => {
  // „/facebook" ar trece de validarea obișnuită de adresă și ar spune apoi că
  // profilul e găzduit chiar pe domeniul cabinetului.
  assert.equal(esteAdresaExterna("/facebook"), false);
  assert.equal(esteAdresaExterna("#facebook"), false);
  assert.equal(esteAdresaExterna("facebook.com/cabinet"), false);
});

test("„https://\" gol nu trece de validare", () => {
  // Un startsWith l-ar fi lăsat să treacă. `new URL` nu.
  assert.equal(esteAdresaExterna("https://"), false);
  assert.equal(esteAdresaExterna("https://localhost"), false, "fără punct nu e domeniu");
});

test("adresa întreagă trece", () => {
  assert.equal(esteAdresaExterna("https://facebook.com/cabinetulmeu"), true);
  assert.equal(esteAdresaExterna("https://www.instagram.com/psiholog.maria/"), true);
});

test("câmpul gol e valid — profilurile sunt opționale", () => {
  assert.equal(esteAdresaExterna(""), true);
  assert.equal(esteAdresaExterna("   "), true);
});

test("se întorc doar profilurile completate, în ordinea din subsol", () => {
  const linkuri = linkurileSociale({
    instagram: "https://instagram.com/psiholog.maria",
    facebook: "https://facebook.com/cabinetulmeu",
  });

  assert.deepEqual(
    linkuri.map((l) => l.nume),
    ["Facebook", "Instagram"],
  );
});

test("o valoare stricată din bază nu ajunge link mort pe site", () => {
  // Validarea din formular e nouă; în bază pot exista valori scrise înainte.
  const linkuri = linkurileSociale({
    facebook: "/facebook",
    instagram: "https://instagram.com/psiholog.maria",
    linkedin: "  ",
    youtube: "nu e adresă",
  });

  assert.deepEqual(
    linkuri.map((l) => l.nume),
    ["Instagram"],
  );
});

test("fără nimic completat nu iese nicio listă", () => {
  assert.deepEqual(linkurileSociale({}), []);
  assert.deepEqual(linkurileSociale(null), []);
  assert.deepEqual(linkurileSociale(undefined), []);
});

const BAZA = new URL("https://cabinet-exemplu.ro");
const PROFILURI = ["https://facebook.com/cabinetulmeu"];

test("profilurile stau pe fișa omului când îi știm numele", () => {
  // Pagina de Facebook a unui cabinet individual e ținută de psiholog.
  const cabinet = {
    nume: "Cabinet Individual de Psihologie Maria Ionescu",
    numePersoana: "Maria Ionescu",
    adresa: "Str. Exemplu 10",
    profiluri: PROFILURI,
  };

  assert.deepEqual(datelePsihologului(BAZA, cabinet).sameAs, PROFILURI);
  assert.ok(!("sameAs" in dateleCabinetului(BAZA, cabinet)), "n-au ce căuta pe amândouă");
});

test("fără numele omului, profilurile rămân pe firmă", () => {
  // Altfel n-ar fi scrise nicăieri, iar legătura site ↔ Facebook s-ar pierde.
  const cabinet = {
    nume: "Cabinet Individual de Psihologie Maria Ionescu",
    adresa: "Str. Exemplu 10",
    profiluri: PROFILURI,
  };

  assert.deepEqual(dateleCabinetului(BAZA, cabinet).sameAs, PROFILURI);
});

test("fără profiluri, sameAs nu se scrie deloc", () => {
  const cabinet = { nume: "Cabinet", numePersoana: "Ana Pop", adresa: "Str. Exemplu 10" };

  assert.ok(!("sameAs" in datelePsihologului(BAZA, cabinet)));
  assert.ok(!("sameAs" in dateleCabinetului(BAZA, cabinet)));
});
