import assert from "node:assert/strict";
import test from "node:test";
import { seServesteNepublicat } from "@/lib/lansare";

/**
 * Proba comutatorului de lansare. Se rulează cu `pnpm test:logica`.
 *
 * Două feluri de a greși, amândouă tăcute:
 *
 * 1. Prea strâmt — clientul rămâne închis afară din propriul panou și nu-și mai
 *    poate publica site-ul. Nimic nu pare stricat: pagina de așteptare arată la
 *    fel de bine și pentru el.
 * 2. Prea larg — un site nescris, cu paisprezece secțiuni goale, ajunge public
 *    pe domeniul unui cabinet. Iar asta se află de la primul pacient care caută.
 */

test("clientul poate ajunge la panou și la conectare", () => {
  // Ăsta e cazul care contează cel mai mult: aici s-ar închide singura ușă.
  assert.ok(seServesteNepublicat("/login"));
  assert.ok(seServesteNepublicat("/dashboard"));
  assert.ok(seServesteNepublicat("/dashboard/setari"));
  assert.ok(seServesteNepublicat("/dashboard/sectiuni/12"));
  assert.ok(seServesteNepublicat("/dashboard/imagini"));
});

test("fișierele pentru motoarele de căutare se servesc, ca să poată refuza", () => {
  // Rescrise la o pagină de HTML, ar întoarce gunoi în loc de un refuz limpede.
  assert.ok(seServesteNepublicat("/robots.txt"));
  assert.ok(seServesteNepublicat("/sitemap.xml"));
});

test("site-ul public rămâne ascuns", () => {
  for (const cale of [
    "/",
    "/servicii",
    "/blog",
    "/blog/un-articol",
    "/programare",
    "/politica-de-confidentialitate",
    "/opengraph-image",
  ]) {
    assert.equal(seServesteNepublicat(cale), false, `ar fi trebuit ascunsă: ${cale}`);
  }
});

test("o cale care doar SEAMĂNĂ cu panoul nu trece", () => {
  /*
   * `/dashboard` e o pagină proprie a clientului, dar `/dashboard-ul-meu` e o
   * pagină pe care și-o poate face el însuși, cu orice conținut. Cu o simplă
   * verificare de prefix, ar fi fost publică pe un site nepublicat — și ar fi
   * fost o cale prin care conținutul nescris iese pe internet.
   */
  assert.equal(seServesteNepublicat("/dashboard-ul-meu"), false);
  assert.equal(seServesteNepublicat("/dashboardx"), false);
  assert.equal(seServesteNepublicat("/loginul-meu"), false);
  assert.equal(seServesteNepublicat("/robots.txt.html"), false);
});
