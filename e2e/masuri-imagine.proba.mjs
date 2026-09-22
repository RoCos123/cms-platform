import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { catreStocare, catreEditor } from "@/lib/sectiuni-editare";

/**
 * Proba măsurilor unei imagini. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Cartonașul „vitrina" din galeria de șabloane își potrivește
 * caseta după raportul pozei, ca poza să se vadă ÎNTREAGĂ — cerut de
 * proprietar pe 22 sept. 2026, după trei încercări de raport fix, fiecare
 * tăind altă margine din capturile lui.
 *
 * Măsurile vin cu poza de la încărcare (`ImageValue.latime/inaltime`) și
 * călătoresc prin conținutul secțiunii. Drumul are două locuri în care se pot
 * pierde în tăcere, amândouă enumerând câmpurile pe nume:
 *   - reconstrucția din `campuri-sectiune.tsx`, la deschiderea formularului;
 *   - alegerea unei poze din bibliotecă (`biblioteca-imagini.tsx`).
 * Pierdute, poza n-ar cădea și n-ar arăta rupt — doar s-ar întoarce, tăcut, la
 * caseta de rezervă. Nimeni n-ar lega asta de o salvare făcută cu o oră
 * înainte.
 */

const CAMPURI = [{ tip: "imagine", cheie: "imagine", eticheta: "Imagine" }];

const POZA = {
  uploadId: "abc",
  url: "/imagini/abc/semnatura",
  altText: "Șablonul Jadeit",
  latime: 1920,
  inaltime: 1030,
};

test("măsurile supraviețuiesc dus-întorsului prin formular", () => {
  const stocat = catreStocare({ imagine: POZA }, CAMPURI);
  const inapoi = catreEditor(stocat, CAMPURI);

  assert.equal(inapoi.imagine.latime, 1920);
  assert.equal(inapoi.imagine.inaltime, 1030);
});

test("poza fără măsuri trece mai departe fără să cadă", () => {
  const faraMasuri = { uploadId: "abc", url: "/imagini/abc/s", altText: "" };
  const stocat = catreStocare({ imagine: faraMasuri }, CAMPURI);

  assert.deepEqual(stocat.imagine, faraMasuri);
});

/*
 * Cele două locuri care enumeră câmpurile pe nume trebuie să le amintească.
 * Probă pe sursă: o reconstrucție care uită un câmp nu produce nicio eroare,
 * nici la tipuri, nici la rulare — doar pierde tăcut ce nu a enumerat.
 */
test("locurile care reconstruiesc o imagine nu uită măsurile", () => {
  for (const cale of [
    "src/components/dashboard/campuri-sectiune.tsx",
    "src/components/dashboard/biblioteca-imagini.tsx",
  ]) {
    const sursa = readFileSync(cale, "utf8");

    assert.ok(sursa.includes("latime"), `${cale} nu pomenește latime`);
    assert.ok(sursa.includes("inaltime"), `${cale} nu pomenește inaltime`);
  }
});

/*
 * Completarea pe server: cine n-are măsuri le primește după `uploadId`, cine
 * le are rămâne neatins, iar un id negăsit nu inventează nimic. Pe funcțiile
 * pure de aici stă `salveazaSectiune` — varianta cu pas manual („re-alege poza
 * din bibliotecă") a picat la primul om care a folosit-o.
 */
const { imaginileFaraMasuri, completeazaMasurileImaginilor } = await import("@/lib/imagini");

const SECTIUNE = {
  titlu: "Cinci feluri de a arăta.",
  elemente: [
    { titlu: "Copal", imagine: { uploadId: "a1", url: "/imagini/a1/s", latime: 1600, inaltime: 900 } },
    { titlu: "Jadeit", imagine: { uploadId: "b2", url: "/imagini/b2/s" } },
    { titlu: "Fără poză" },
  ],
};

test("găsește doar imaginile fără măsuri, oricât de adânc ar sta", () => {
  assert.deepEqual([...imaginileFaraMasuri(SECTIUNE)], ["b2"]);
});

test("completează măsurile după uploadId și nu atinge restul", () => {
  const masuri = new Map([["b2", { latime: 1920, inaltime: 1030 }]]);
  const completat = completeazaMasurileImaginilor(SECTIUNE, masuri);

  assert.deepEqual(completat.elemente[1].imagine, {
    uploadId: "b2",
    url: "/imagini/b2/s",
    latime: 1920,
    inaltime: 1030,
  });
  // Cine avea măsuri e chiar același obiect, nu o copie schimbată.
  assert.deepEqual(completat.elemente[0], SECTIUNE.elemente[0]);
  assert.equal(imaginileFaraMasuri(completat).size, 0);
});

test("un id care nu e în hartă rămâne fără măsuri, nu cu unele inventate", () => {
  const completat = completeazaMasurileImaginilor(SECTIUNE, new Map());

  assert.deepEqual(completat.elemente[1].imagine, { uploadId: "b2", url: "/imagini/b2/s" });
});

/*
 * Ultima plasă, și cea care chiar ține: cartonașul „vitrina" cere
 * `incadrare="intreaga"`, adică poza încape toată INDIFERENT de măsuri.
 *
 * Tot ce e mai sus — măsurile duse prin conținut, completarea pe server —
 * doar scoate dungile de pe margini, ca să iasă frumos. Nu mai hotărăște dacă
 * se taie sau nu. Regula asta s-a scris după ce trei încercări la rând, toate
 * sprijinite pe măsuri, au picat în tăcere: o verigă lipsă undeva pe drum
 * întorcea cartonașul la tăiere, iar proprietarul vedea „e la fel".
 *
 * Probă pe sursă, fiindcă nu există nicio eroare de prins: un `incadrare` uitat
 * nu strică nimic vizibil, doar aduce tăierea înapoi.
 */
test("cartonașul vitrina cere poza întreagă, nu tăiată", () => {
  const sursa = readFileSync("src/components/site/sections/portfolio.tsx", "utf8");
  const cartonas = sursa.slice(sursa.indexOf("function CartonasVitrina"));

  assert.match(cartonas, /incadrare="intreaga"/);
});
