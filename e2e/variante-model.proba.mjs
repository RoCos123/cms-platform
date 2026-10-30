import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { campuriPentruRand, metaSectiune } from "@/lib/sectiuni";
import { catreEditor, catreStocare, valideaza } from "@/lib/sectiuni-editare";
import { MAX_VARIANTE_MODEL } from "@/lib/pagina-vanzare";
import { raportRamei } from "@/lib/rame-poze";
import { dimensiuniPozaSectiune } from "@/lib/dimensiuni-poze";
import { getTemplate } from "@/lib/templates";

/**
 * Proba „Alte variante ale modelului" (30 oct. 2026). `pnpm test:logica`.
 *
 * Pe cartonașele galeriei de pe pagina de vânzare, poza trece singură între capturi ale aceluiași
 * demo în alte culori și fonturi (varianta B, aleasă de proprietar din machete), fără nimic scris
 * peste ea. Ce apără:
 * 1. câmpul apare DOAR pe galeria paginii de vânzare — un cabinet n-are ce face cu el;
 * 2. salvarea îl păstrează: salvarea aruncă tot ce nu e declarat, deci editorul și serverul
 *    trebuie să ceară câmpurile prin aceeași funcție;
 * 3. nicio etichetă și nicio bulină pe poză (cerut de proprietar după prima versiune);
 * 4. animația stă pe loc la cine a cerut mai puțină mișcare și sub maus.
 */

const citeste = (cale) => readFileSync(cale, "utf8");
const PORTFOLIO = metaSectiune("portfolio");
const elementeDin = (campuri) => campuri.find((camp) => camp.cheie === "elemente");
const areVariante = (campuri) => elementeDin(campuri).campuri.some((camp) => camp.cheie === "variante");
const CAMPURI_VANZARE = campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "vanzare" });

const DATE = {
  titlu: "5 modele premium",
  elemente: [
    {
      titlu: "Căldură",
      descriere: "Demo",
      buton: { text: "", href: "https://model-caldura.vercel.app/" },
      imagine: { url: "/imagini/a/b", altText: "Modelul Căldură", uploadId: "u1" },
      variante: [
        { imagine: { url: "/imagini/c/d", altText: "", uploadId: "u2" } },
        { imagine: { url: "/imagini/e/f", altText: "", uploadId: "u3" } },
      ],
    },
  ],
};

test("câmpul apare doar pe galeria „vitrina” a paginii de vânzare", () => {
  assert.equal(areVariante(CAMPURI_VANZARE), true);
  // Același rând pe un cabinet, altă așezare pe pagina de vânzare, altă secțiune: neschimbate.
  assert.equal(campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "cabinet" }), PORTFOLIO.campuri);
  assert.equal(campuriPentruRand(PORTFOLIO, { variant: null, tipSite: "vanzare" }), PORTFOLIO.campuri);
  const hero = metaSectiune("hero");
  assert.equal(campuriPentruRand(hero, { variant: "vitrina", tipSite: "vanzare" }), hero.campuri);
  // Descrierea secțiunii rămâne cea de dinainte: câmpul se adaugă pe o copie.
  assert.equal(areVariante(PORTFOLIO.campuri), false);
});

test("o variantă e doar captura: fără culoare, fonturi sau alt text de completat", () => {
  const variante = elementeDin(CAMPURI_VANZARE).campuri.find((camp) => camp.cheie === "variante");
  assert.deepEqual(variante.campuri.map((camp) => [camp.cheie, camp.tip]), [["imagine", "imagine"]]);
  assert.equal(variante.campuri[0].decorativa, true);
});

test("salvarea păstrează variantele doar cu câmpurile rândului — de-asta le cere și serverul", () => {
  const salvat = catreStocare(catreEditor(DATE, CAMPURI_VANZARE), CAMPURI_VANZARE);
  assert.deepEqual(salvat.elemente[0].variante, DATE.elemente[0].variante);
  // Cu descrierea simplă a secțiunii, variantele s-ar pierde la prima salvare.
  assert.equal(catreStocare(catreEditor(DATE, PORTFOLIO.campuri), PORTFOLIO.campuri).elemente[0].variante, undefined);

  // Culoarea și fonturile salvate de prima versiune (cu etichetă) cad la următoarea salvare.
  const vechi = { ...DATE, elemente: [{ ...DATE.elemente[0], variante: [{ ...DATE.elemente[0].variante[0], culoare: "Safir", fonturi: "Modern" }] }] };
  assert.deepEqual(catreStocare(catreEditor(vechi, CAMPURI_VANZARE), CAMPURI_VANZARE).elemente[0].variante, [DATE.elemente[0].variante[0]]);

  const actiune = citeste("src/app/dashboard/sectiuni/actions.ts");
  assert.match(actiune, /campuriPentruRand\(meta, \{ variant: rand\.variant/);
  assert.match(actiune, /catreStocare\(catreEditor\(date, campuri\), campuri\)/);
  const pagina = citeste("src/app/dashboard/sectiuni/[id]/page.tsx");
  assert.match(pagina, /catreEditor\(continut, campuri\)/);
  assert.match(pagina, /meta=\{\{ \.\.\.meta, campuri \}\}/);
});

test("mai multe variante decât încap: refuzat și pe server, nu doar oprit de „+ Adaugă”", () => {
  const cu = (numar) =>
    catreEditor(
      { ...DATE, elemente: [{ ...DATE.elemente[0], variante: Array.from({ length: numar }, () => DATE.elemente[0].variante[0]) }] },
      CAMPURI_VANZARE,
    );
  assert.equal(valideaza(cu(MAX_VARIANTE_MODEL), CAMPURI_VANZARE)["elemente.0.variante"], undefined);
  assert.ok(valideaza(cu(MAX_VARIANTE_MODEL + 1), CAMPURI_VANZARE)["elemente.0.variante"]);
});

test("captura unei variante are aceeași casetă ca poza principală (16/9, sus)", () => {
  const context = { asezari: getTemplate("claritate").asezari, variant: "vitrina" };
  assert.equal(raportRamei("portfolio", "elemente.2.variante.1.imagine", context), "16 / 9");
  assert.equal(
    dimensiuniPozaSectiune("portfolio", "elemente.0.variante.0.imagine", context),
    dimensiuniPozaSectiune("portfolio", "elemente.0.imagine", context),
  );
  const portfolio = citeste("src/components/site/sections/portfolio.tsx");
  assert.match(portfolio, /pozitie: varianta\.imagine!\.pozitie \?\? \{ x: 50, y: 0 \}/);
  assert.match(citeste("src/components/site/sections/cadre-vitrina.tsx"), /aspectRatio="16 \/ 9"/);
});

test("animația: fără nimic scris pe poză; stă pe loc la mișcare redusă, sub maus și în afara ecranului", () => {
  const cod = citeste("src/components/site/sections/cadre-vitrina.tsx");
  assert.match(cod, /prefers-reduced-motion: reduce/);
  assert.match(cod, /if \(numar < 2 \|\| !peEcran \|\| subMaus \|\| miscareRedusa\) return;/);
  // Nicio etichetă și nicio bulină (cerut de proprietar, 30 oct. 2026).
  assert.doesNotMatch(cod, /<button|aria-pressed|eticheta/);
});
