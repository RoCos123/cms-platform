import assert from "node:assert/strict";
import test from "node:test";
import {
  FURNIZORI,
  FURNIZOR_IMPLICIT,
  alegeFurnizor,
  tokenulDinFormular,
} from "@/lib/captcha";

/**
 * Proba furnizorului de casetă anti-spam. Se rulează cu `pnpm test:logica`.
 *
 * Miza e mai mare decât pare. Formularele publice sunt singura cale prin care un
 * om ajunge la cabinet, iar caseta stă exact în fața lor: dacă platforma cere un
 * token pe care widgetul nu-l produce — fiindcă s-a încărcat scriptul unui
 * furnizor și se citește câmpul altuia — fiecare mesaj e respins, pe toate
 * site-urile deodată, fără ca nimic să pară stricat.
 *
 * A doua miză e plafonul de domenii. Turnstile se oprește la 10 domenii pe cheie
 * (200 pe cont), iar platforma trece de 200 de cabinete. De asta implicitul
 * trebuie să rămână hCaptcha, singurul care merge pe oricâte domenii — și de
 * asta e o probă, nu doar un comentariu.
 */

test("implicit e hCaptcha — singurul fără plafon de domenii", () => {
  assert.equal(FURNIZOR_IMPLICIT, "hcaptcha");
  assert.equal(alegeFurnizor(undefined).nume, "hcaptcha");
  assert.equal(alegeFurnizor(null).nume, "hcaptcha");
  assert.equal(alegeFurnizor("").nume, "hcaptcha");
  assert.equal(alegeFurnizor("   ").nume, "hcaptcha");
});

test("furnizorul se alege din variabila de mediu, oricum ar fi scris", () => {
  assert.equal(alegeFurnizor("turnstile").nume, "turnstile");
  assert.equal(alegeFurnizor("Turnstile").nume, "turnstile");
  assert.equal(alegeFurnizor("  TURNSTILE  ").nume, "turnstile");
  assert.equal(alegeFurnizor("hcaptcha").nume, "hcaptcha");
});

test("o valoare greșită cade pe implicit, nu aruncă", () => {
  // Un typo într-o variabilă de mediu nu trebuie să oprească formularele de pe
  // toate site-urile. Cade pe implicit și lasă o urmă în jurnal.
  const avertismente = [];
  const vechi = console.warn;
  console.warn = (m) => avertismente.push(String(m));
  try {
    assert.equal(alegeFurnizor("recaptcha").nume, FURNIZOR_IMPLICIT);
    assert.equal(alegeFurnizor("hcapcha").nume, FURNIZOR_IMPLICIT);
  } finally {
    console.warn = vechi;
  }
  assert.equal(avertismente.length, 2);
  assert.match(avertismente[0], /recaptcha/);
});

test("fiecare furnizor își citește propriul câmp ascuns", () => {
  const formular = new FormData();
  formular.set("h-captcha-response", "token-h");
  formular.set("cf-turnstile-response", "token-cf");

  assert.equal(tokenulDinFormular(formular, FURNIZORI.hcaptcha), "token-h");
  assert.equal(tokenulDinFormular(formular, FURNIZORI.turnstile), "token-cf");
});

test("lipsa tokenului e `null`, nu șir gol", () => {
  // `verificaCaptcha` decide pe `null`; un șir gol trimis mai departe ar ajunge
  // la furnizor și s-ar întoarce ca „invalid”, cu alt mesaj pentru om.
  const gol = new FormData();
  assert.equal(tokenulDinFormular(gol, FURNIZORI.hcaptcha), null);

  const golit = new FormData();
  golit.set("h-captcha-response", "");
  assert.equal(tokenulDinFormular(golit, FURNIZORI.hcaptcha), null);

  const fisier = new FormData();
  fisier.set("h-captcha-response", new Blob(["x"]));
  assert.equal(tokenulDinFormular(fisier, FURNIZORI.hcaptcha), null);
});

test("un furnizor nu poate citi câmpul celuilalt", () => {
  // Exact pana tăcută de care e vorba mai sus: script de la unul, câmp căutat
  // de la celălalt, deci token mereu lipsă și formular mereu respins.
  const doarH = new FormData();
  doarH.set("h-captcha-response", "token-h");
  assert.equal(tokenulDinFormular(doarH, FURNIZORI.turnstile), null);

  assert.notEqual(FURNIZORI.hcaptcha.campToken, FURNIZORI.turnstile.campToken);
  assert.notEqual(FURNIZORI.hcaptcha.campLimba, FURNIZORI.turnstile.campLimba);
});

test("adresele sunt https și cer randare explicită prin callback", () => {
  for (const furnizor of Object.values(FURNIZORI)) {
    const src = furnizor.script("__callbackul_meu");

    assert.ok(src.startsWith("https://"), `${furnizor.nume}: scriptul nu e pe https`);
    assert.ok(src.includes("render=explicit"), `${furnizor.nume}: lipsește randarea explicită`);
    // Documentația hCaptcha cere `render()` chemat din callbackul `onload`, nu
    // din evenimentul `load`. Dacă numele nu ajunge în adresă, callbackul nu se
    // cheamă niciodată și caseta nu apare deloc.
    assert.ok(
      src.includes("onload=__callbackul_meu"),
      `${furnizor.nume}: numele callbackului nu ajunge în adresă`,
    );
    assert.ok(
      furnizor.verificare.startsWith("https://"),
      `${furnizor.nume}: verificarea nu e pe https`,
    );
  }
});

test("cheia din tabel e aceeași cu numele furnizorului", () => {
  // Altfel `alegeFurnizor("turnstile")` ar întoarce un obiect care se prezintă
  // drept altcineva, iar jurnalele ar arăta furnizorul greșit la fiecare pană.
  for (const [cheie, furnizor] of Object.entries(FURNIZORI)) {
    assert.equal(cheie, furnizor.nume);
    assert.equal(cheie, furnizor.global);
  }
});
