import assert from "node:assert/strict";
import test from "node:test";
import { DISALLOW_ROBOTS, estePanou, esteConectare } from "@/lib/rute";
import { ADRESE_REZERVATE } from "@/lib/pagini";

/**
 * Proba adreselor noastre față de ale clientului. `pnpm test:logica`.
 *
 * Greșeala pe care o apără, găsită pe 1 sept. 2026: „e pagină de panou?” se
 * hotăra cu `startsWith("/dashboard")`, iar asta e adevărat și pentru
 * `/dashboard-ul-meu` — o adresă pe care clientul are voie să și-o facă. Pagina
 * lui cerea conectare, deci n-o putea citi niciun vizitator; iar `robots.txt` o
 * ținea și afară din Google. Amândouă tăcute: pagina exista, se salva, se vedea
 * în panou, și nu ajungea la nimeni.
 */

test("ecranele panoului sunt recunoscute", () => {
  assert.ok(estePanou("/dashboard"));
  assert.ok(estePanou("/dashboard/setari"));
  assert.ok(estePanou("/dashboard/sectiuni/12"));
});

test("o pagină a clientului care începe la fel NU e panou", () => {
  // Inima probei. Fiecare dintre astea e un slug pe care panoul îl acceptă.
  for (const cale of [
    "/dashboard-ul-meu",
    "/dashboardul-meu",
    "/dashboard-2024",
    "/admin-ul-meu",
    "/site-unavailable-2",
  ]) {
    assert.equal(estePanou(cale), false, `nu e panou: ${cale}`);
  }
});

test("conectarea se potrivește exact", () => {
  assert.ok(esteConectare("/login"));
  assert.equal(esteConectare("/loginul-meu"), false);
  assert.equal(esteConectare("/login/altceva"), false);
});

test("robots.txt nu scoate din Google paginile clientului", () => {
  /*
   * `Disallow` se potrivește ca prefix de TEXT, nu de cale. O intrare `/dashboard`
   * ar prinde și `/dashboard-ul-meu`. Deci nicio intrare din listă n-are voie să
   * fie o rădăcină goală: fiecare se termină ori cu `/` (tot ce e dedesubt), ori
   * cu `$` (adresa în sine).
   */
  for (const intrare of DISALLOW_ROBOTS) {
    assert.match(
      intrare,
      /(\/|\$)$/,
      `intrarea „${intrare}” prinde și adrese care nu sunt ale noastre`,
    );
  }

  // Și, concret: nicio intrare nu se potrivește pe pagina clientului.
  const paginaClientului = "/dashboard-ul-meu";
  for (const intrare of DISALLOW_ROBOTS) {
    const tipar = intrare.endsWith("$") ? intrare.slice(0, -1) : intrare;
    const seLoveste = intrare.endsWith("$")
      ? paginaClientului === tipar
      : paginaClientului.startsWith(tipar);
    assert.equal(seLoveste, false, `„${intrare}” ar fi scos din Google ${paginaClientului}`);
  }
});

test("adresele noastre chiar sunt oprite din a fi luate de client", () => {
  // Regula de sus ține doar dacă panoul refuză sloganele exacte. Dacă cineva
  // scoate vreodată `dashboard` din lista de adrese rezervate, clientul își
  // poate face o pagină care nu s-ar vedea niciodată — iar proba asta cade.
  for (const rezervata of ["dashboard", "admin", "login", "site-unavailable", "imagini", "nepublicat"]) {
    assert.ok(
      ADRESE_REZERVATE.includes(rezervata),
      `„${rezervata}” trebuie să rămână adresă rezervată`,
    );
  }
});
