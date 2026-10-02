import assert from "node:assert/strict";
import test from "node:test";
import { catreEditor, valideaza } from "@/lib/sectiuni-editare";
import { metaSectiune } from "@/lib/sectiuni";

/**
 * Proba limitei de elemente la liste. `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Limita unei liste („Apariții”: 12) era aplicată DOAR în panou:
 * butonul „+ Adaugă” se oprea la limită. Serverul o verifica doar la listele de
 * rânduri simple (`listaText`), nu și la cele cu câmpuri (`lista`) — deci un
 * conținut venit pe altă cale decât formularul (o cerere făcută de mână, o copie
 * din SQL între site-uri) trecea de ea, iar site-ul îl afișa întreg.
 *
 * Nu era o gaură pentru clientul obișnuit, care scrie din panou. Dar o limită
 * pusă doar în interfață nu e o limită: e o sugestie. Verificarea de pe server e
 * singura care contează (aceeași regulă ca la restul validărilor din fișier).
 */

/** Un element valid din „Apariții”, în forma pe care o ține formularul. */
function aparitii(cate) {
  return Array.from({ length: cate }, (_, i) => ({
    sursa: `Sursa ${i}`,
    titlu: `Titlu ${i}`,
  }));
}

function valideazaLogos(cate) {
  const meta = metaSectiune("logos");
  const valoare = catreEditor({ titlu: "Apariții", aparitii: aparitii(cate) }, meta.campuri);

  return valideaza(valoare, meta.campuri);
}

test("la limită (12) nu e nicio eroare", () => {
  assert.deepEqual(valideazaLogos(12), {});
});

test("sub limită nu e nicio eroare", () => {
  assert.deepEqual(valideazaLogos(1), {});
  assert.deepEqual(valideazaLogos(11), {});
});

test("peste limită (13) serverul refuză, cu mesaj pe câmpul listei", () => {
  const erori = valideazaLogos(13);

  assert.ok(erori.aparitii, "eroarea trebuie să stea pe lista `aparitii`");
  assert.match(erori.aparitii, /12/, "mesajul spune care e limita");
  assert.match(erori.aparitii, /13/, "mesajul spune câte sunt acum");
});

test("mesajul are forma corectă din română, cu „de” de la 20 în sus", () => {
  // Verificat cu mâna pe rezultatul real, nu presupus: 13 elemente, dar 20 DE
  // elemente. `numara` știe regula; proba o ține, ca un mesaj strâmb să nu
  // ajungă la client.
  assert.equal(valideazaLogos(13).aparitii, "Cel mult 12 elemente. Acum sunt 13 elemente.");
  assert.equal(valideazaLogos(20).aparitii, "Cel mult 12 elemente. Acum sunt 20 de elemente.");
});

test("o listă fără limită nu e atinsă", () => {
  const campuri = [
    {
      tip: "lista",
      cheie: "elemente",
      eticheta: "Elemente",
      etichetaElement: "element",
      rezumatDin: "titlu",
      campuri: [{ tip: "text", cheie: "titlu", eticheta: "Titlu" }],
    },
  ];
  const valoare = catreEditor({ elemente: Array.from({ length: 500 }, () => ({ titlu: "x" })) }, campuri);

  assert.deepEqual(valideaza(valoare, campuri), {});
});

test("limita se aplică și la o listă DIN INTERIORUL altei liste", () => {
  // „Programe” are `materiale` (max 8) înăuntru. Erorile listelor imbricate
  // ajung la drumul lor complet („elemente.0.materiale”), nu la cel al părintelui.
  const meta = metaSectiune("portfolio");
  const valoare = catreEditor(
    {
      titlu: "Programe",
      elemente: [
        {
          titlu: "Retreat",
          descriere: "Descriere",
          materiale: Array.from({ length: 9 }, (_, i) => ({ text: `Material ${i}` })),
        },
      ],
    },
    meta.campuri,
  );

  const erori = valideaza(valoare, meta.campuri);

  assert.ok(erori["elemente.0.materiale"], "limita de 8 trebuie să prindă și lista imbricată");
});
