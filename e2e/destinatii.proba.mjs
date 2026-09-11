import assert from "node:assert/strict";
import test from "node:test";
import { ANCORE_SECTIUNI, construiesteDestinatii } from "@/lib/destinatii";

/**
 * Proba destinațiilor unui buton. `pnpm test:logica`.
 *
 * Ce apără: butonul să ducă doar la locuri care CHIAR există pe site (secțiuni
 * vizibile, pagini), nu la o adresă scrisă de mână care se dovedește o pagină
 * inexistentă — bug-ul de la care a pornit tot.
 */

test("doar secțiunile vizibile devin destinații, în ordine fixă", () => {
  // Vin în altă ordine decât cea din listă; ies mereu în ordinea din ANCORE.
  const destinatii = construiesteDestinatii(["contact", "pricing", "portfolio"]);
  assert.deepEqual(destinatii, [
    { eticheta: "Programe și experiențe", href: "#programe" },
    { eticheta: "Pachete", href: "#pachete" },
    { eticheta: "Formularul de contact", href: "#contact" },
  ]);
});

test("o secțiune ascunsă (lipsă din listă) nu apare ca destinație", () => {
  const destinatii = construiesteDestinatii(["contact"]);
  assert.deepEqual(destinatii, [{ eticheta: "Formularul de contact", href: "#contact" }]);
  // `hero` n-are ancoră, deci nu apare nici dacă e „vizibil".
  assert.deepEqual(construiesteDestinatii(["hero", "quote"]), []);
});

test("paginile de sine stătătoare se leagă cu /adresă, după secțiuni", () => {
  const destinatii = construiesteDestinatii(
    ["contact"],
    [{ slug: "tarife", titlu: "Tarife" }],
  );
  assert.deepEqual(destinatii, [
    { eticheta: "Formularul de contact", href: "#contact" },
    { eticheta: "Tarife", href: "/tarife" },
  ]);
});

test("ancorele sunt exact id-urile din componentele de secțiune", () => {
  // Regresie: dacă cineva schimbă `id`-ul unei secțiuni fără să schimbe aici,
  // butonul ar duce în gol. Valorile astea trebuie să rămână lipite de
  // `<Section id="…">`.
  assert.equal(ANCORE_SECTIUNI.contact.ancora, "contact");
  assert.equal(ANCORE_SECTIUNI.portfolio.ancora, "programe");
  assert.equal(ANCORE_SECTIUNI.pricing.ancora, "pachete");
  assert.equal(ANCORE_SECTIUNI.features.ancora, "servicii");
});
