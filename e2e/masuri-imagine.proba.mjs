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
