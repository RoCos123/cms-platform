import assert from "node:assert/strict";
import test from "node:test";
import { scoateIncarcarea } from "@/lib/imagini";

/**
 * Proba scoaterii unei încărcări din secțiuni la ștergere. `pnpm test:logica`.
 *
 * Regula s-a născut dintr-un lucru prins de proprietar: ștergeai un document,
 * dar butonul de descărcare rămânea pe pachet și ducea la un fișier care nu mai
 * există. Cauza: materialul referă documentul prin `fisierId`, iar curățarea
 * scana doar după `uploadId` (poze). Acum `scoateIncarcarea` le prinde pe
 * amândouă.
 */

function date() {
  return {
    imagine: { uploadId: "img-1", url: "/imagini/img-1/xyz", altText: "" },
    pachete: [
      {
        nume: "Consiliere",
        materiale: [
          { text: "Descarcă fișa", fisier: { fisierId: "doc-1", url: "/fisiere/doc-1/abc" } },
          { text: "Alt material", fisier: { fisierId: "doc-2", url: "/fisiere/doc-2/def" } },
        ],
      },
    ],
  };
}

test("ștergerea unui document scoate materialul care-l folosea", () => {
  const rezultat = scoateIncarcarea(date(), "doc-1");
  assert.equal(rezultat.schimbat, true);

  const materiale = rezultat.valoare.pachete[0].materiale;
  // Fișierul dispare (butonul nu se mai randează), textul rămâne — poate realege.
  assert.equal(materiale[0].fisier, undefined);
  assert.equal(materiale[0].text, "Descarcă fișa");
  // Celălalt material și poza rămân neatinse.
  assert.deepEqual(materiale[1].fisier, { fisierId: "doc-2", url: "/fisiere/doc-2/def" });
  assert.deepEqual(rezultat.valoare.imagine, date().imagine);
});

test("aceeași funcție scoate și o poză, după uploadId", () => {
  const rezultat = scoateIncarcarea(date(), "img-1");
  assert.equal(rezultat.schimbat, true);
  assert.equal(rezultat.valoare.imagine, undefined);
  // Materialele rămân — un id e ori poză, ori material, nu amândouă.
  assert.equal(rezultat.valoare.pachete[0].materiale.length, 2);
});

test("un id care nu e nicăieri nu schimbă nimic", () => {
  const original = date();
  const rezultat = scoateIncarcarea(original, "nu-exista");
  assert.equal(rezultat.schimbat, false);
  // Aceeași referință: apelantul nu scrie în bază un rând neatins.
  assert.equal(rezultat.valoare, original);
});
