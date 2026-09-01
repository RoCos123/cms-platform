import assert from "node:assert/strict";
import test from "node:test";
import { adresaImaginii, idValid, semneaza, semnaturaEValida } from "@/lib/imagini-adrese";
import { rescrieAdresele } from "@/lib/imagini";

/**
 * Proba adreselor semnate de imagini. Se rulează cu `pnpm test:logica`.
 *
 * Miza e chiar cerința proprietarului: „clientul A nu trebuie niciodată să aibă
 * acces la orice tip de fișier al oricărui alt client”. Depozitul e privat, iar
 * singura cale către un fișier e o adresă semnată de serverul nostru. Dacă
 * semnătura ar putea fi ocolită, ghicită sau fabricată, cerința ar cădea — și ar
 * cădea tăcut, fiindcă totul ar arăta că funcționează.
 */

const SECRET = "cheie-de-proba-nu-e-a-nimanui";
const ID = "3f1c8a02-4c7e-4a6f-9b21-0d5e7c8a1234";
const ALT_ID = "9a2b7d31-8e5f-4c02-a7d6-1b3e4f5a6789";

test("semnătura e stabilă, dar alta pentru fiecare imagine", () => {
  assert.equal(semneaza(SECRET, ID), semneaza(SECRET, ID));
  assert.notEqual(semneaza(SECRET, ID), semneaza(SECRET, ALT_ID));
});

test("altă cheie, altă semnătură", () => {
  // Ăsta e motivul pentru care nimeni din afară nu poate fabrica o adresă:
  // fără cheia serverului, semnătura nu se poate produce.
  assert.notEqual(semneaza(SECRET, ID), semneaza("altă-cheie", ID));
});

test("semnătura trece prin adresă fără să fie stricată", () => {
  const s = semneaza(SECRET, ID);
  // Base64URL: fără `/`, `+` sau `=`. Cu ele, semnătura ar rupe calea sau ar fi
  // recodificată de vreun proxy, iar poza ar da 404 din senin.
  assert.match(s, /^[A-Za-z0-9_-]+$/);
  assert.equal(s, encodeURIComponent(s));
  // 16 octeți din HMAC = 22 de caractere. Destul cât ghicitul să fie exclus.
  assert.equal(s.length, 22);
});

test("o semnătură greșită nu trece", () => {
  const buna = semneaza(SECRET, ID);
  assert.ok(semnaturaEValida(SECRET, ID, buna));

  assert.equal(semnaturaEValida(SECRET, ID, ""), false);
  assert.equal(semnaturaEValida(SECRET, ID, buna.slice(0, -1)), false);
  assert.equal(semnaturaEValida(SECRET, ID, buna.slice(0, -1) + "x"), false);
  // Semnătura ALTEI imagini, pusă pe imaginea asta: exact ce ar încerca cineva
  // care are o adresă validă și vrea altă poză.
  assert.equal(semnaturaEValida(SECRET, ID, semneaza(SECRET, ALT_ID)), false);
  // Semnătura corectă, dar dintr-o altă platformă.
  assert.equal(semnaturaEValida(SECRET, ID, semneaza("altă-cheie", ID)), false);
});

test("o „semnătură” cu diacritice e respinsă, nu aruncă", () => {
  /*
   * `timingSafeEqual` aruncă pe tampoane de lungimi diferite, iar un caracter cu
   * diacritice ocupă doi octeți: 22 de caractere pot însemna 23 de octeți. Fără
   * grija asta, oricine putea face ruta de imagini să arunce, trimițând o adresă
   * cu „ă” în semnătură.
   */
  const cuDiacritice = "ă".repeat(22);
  assert.equal(cuDiacritice.length, 22);
  assert.equal(semnaturaEValida(SECRET, ID, cuDiacritice), false);
});

test("doar un UUID adevărat ajunge la baza de date", () => {
  assert.ok(idValid(ID));
  assert.ok(idValid(ID.toUpperCase()));

  for (const gresit of [
    "",
    "nu-e-uuid",
    "../../etc/passwd",
    `${ID} or 1=1`,
    `${ID}extra`,
    "3f1c8a02-4c7e-4a6f-9b21-0d5e7c8a123",
  ]) {
    assert.equal(idValid(gresit), false, `ar fi trebuit respins: ${gresit}`);
  }
});

test("adresa are forma pe care o așteaptă ruta", () => {
  const vechi = process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SECRET_KEY = SECRET;
  try {
    assert.equal(adresaImaginii(ID), `/imagini/${ID}/${semneaza(SECRET, ID)}`);
  } finally {
    if (vechi === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = vechi;
  }
});

test("fără cheie, adresa nu se inventează — se aruncă", () => {
  // Mai bine o eroare zgomotoasă decât o adresă nesemnată care ar cere o
  // portiță „mergi și fără semnătură" în rută.
  const vechi = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  try {
    assert.throws(() => adresaImaginii(ID), /SUPABASE_SECRET_KEY/);
  } finally {
    if (vechi !== undefined) process.env.SUPABASE_SECRET_KEY = vechi;
  }
});

// ----------------------------------------------------------------------------
// Rescrierea adreselor vechi din conținutul salvat.
// ----------------------------------------------------------------------------

const adresa = (uploadId) => `/imagini/${uploadId}/semnat`;

test("o adresă veche de Supabase nu mai poate fi randată", () => {
  /*
   * Inima izolării. În conținutul salvat au rămas adrese absolute de pe vremea
   * depozitului public. Dacă vreuna ar mai ajunge într-un `src`, ar fi exact
   * fișierul unui client servit de pe pagina altuia. Aici se pierde.
   */
  const continut = {
    imagine: {
      uploadId: ID,
      url: "https://exemplu.supabase.co/storage/v1/object/public/media/alt-site/poza.jpg",
      altText: "Cabinetul",
    },
  };

  const rescris = rescrieAdresele(continut, adresa);
  assert.equal(rescris.imagine.url, `/imagini/${ID}/semnat`);
  assert.equal(rescris.imagine.altText, "Cabinetul", "restul câmpurilor rămân");
});

test("rescrierea ajunge oricât de adânc ar sta imaginea", () => {
  const continut = {
    titlu: "Servicii",
    elemente: [
      { nume: "unu", imagine: { uploadId: ID, url: "vechi", altText: "a" } },
      { nume: "doi", cuiburi: { adanc: { poza: { uploadId: ALT_ID, url: "vechi", altText: "b" } } } },
    ],
  };

  const rescris = rescrieAdresele(continut, adresa);
  assert.equal(rescris.elemente[0].imagine.url, `/imagini/${ID}/semnat`);
  assert.equal(rescris.elemente[1].cuiburi.adanc.poza.url, `/imagini/${ALT_ID}/semnat`);
  assert.equal(rescris.titlu, "Servicii");
  assert.equal(rescris.elemente[0].nume, "unu");
});

test("o adresă pusă de client către alt site rămâne neatinsă", () => {
  // Fără `uploadId` nu e fișierul nostru: n-avem ce semna și n-avem dreptul
  // să-i schimbăm adresa.
  const continut = { imagine: { url: "https://alt-site.ro/poza.jpg", altText: "" } };
  assert.deepEqual(rescrieAdresele(continut, adresa), continut);
});

test("valorile care nu sunt imagini trec nevătămate", () => {
  for (const valoare of [null, undefined, "text", 42, true, [], {}]) {
    assert.deepEqual(rescrieAdresele(valoare, adresa), valoare);
  }
});
