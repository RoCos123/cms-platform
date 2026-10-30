import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { campuriPentruRand, metaSectiune } from "@/lib/sectiuni";
import { catreEditor, catreStocare, valideaza } from "@/lib/sectiuni-editare";
import {
  CULORI_VARIANTA,
  FONTURI_VARIANTA,
  MAX_VARIANTE_MODEL,
  TEXTE_VANZARE,
  culoareaVariantei,
  etichetaVariantei,
} from "@/lib/pagina-vanzare";
import { PERECHI_FONTURI } from "@/lib/aspect/fonturi";
import { PRESETURI_MATASOASE, PRESETURI_MATE } from "@/lib/aspect/salvare";
import { raportRamei } from "@/lib/rame-poze";
import { dimensiuniPozaSectiune } from "@/lib/dimensiuni-poze";
import { getTemplate } from "@/lib/templates";

/**
 * Proba „Alte variante ale modelului" (30 oct. 2026). `pnpm test:logica`.
 *
 * Pe cartonașele galeriei de pe pagina de vânzare, poza trece singură între capturi ale aceluiași
 * demo în alte culori și fonturi (varianta B, aleasă de proprietar din machete). Ce apără:
 * 1. câmpul apare DOAR pe galeria paginii de vânzare — un cabinet n-are ce face cu el;
 * 2. salvarea îl păstrează: salvarea aruncă tot ce nu e declarat, deci editorul și serverul
 *    trebuie să ceară câmpurile prin aceeași funcție;
 * 3. culoarea și fonturile sunt doar din listele din „Aspect" — nu text pus de mână pe poză;
 * 4. animația stă pe loc la cine a cerut mai puțină mișcare și sub maus.
 */

const citeste = (cale) => readFileSync(cale, "utf8");
const PORTFOLIO = metaSectiune("portfolio");
const elementeDin = (campuri) => campuri.find((camp) => camp.cheie === "elemente");
const areVariante = (campuri) => elementeDin(campuri).campuri.some((camp) => camp.cheie === "variante");

const DATE = {
  titlu: "5 modele premium",
  elemente: [
    {
      titlu: "Căldură",
      descriere: "Demo",
      buton: { text: "", href: "https://model-caldura.vercel.app/" },
      imagine: { url: "/imagini/a/b", altText: "Modelul Căldură", uploadId: "u1" },
      variante: [
        { imagine: { url: "/imagini/c/d", altText: "", uploadId: "u2" }, culoare: "Safir", fonturi: "Modern" },
        { imagine: { url: "/imagini/e/f", altText: "", uploadId: "u3" }, culoare: "Oliv Mat", fonturi: "Personal" },
      ],
    },
  ],
};

test("câmpul apare doar pe galeria „vitrina” a paginii de vânzare", () => {
  assert.equal(areVariante(campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "vanzare" })), true);
  // Același rând pe un cabinet, altă așezare pe pagina de vânzare, altă secțiune: neschimbate.
  assert.equal(campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "cabinet" }), PORTFOLIO.campuri);
  assert.equal(campuriPentruRand(PORTFOLIO, { variant: null, tipSite: "vanzare" }), PORTFOLIO.campuri);
  const hero = metaSectiune("hero");
  assert.equal(campuriPentruRand(hero, { variant: "vitrina", tipSite: "vanzare" }), hero.campuri);
  // Descrierea secțiunii rămâne cea de dinainte: câmpul se adaugă pe o copie.
  assert.equal(areVariante(PORTFOLIO.campuri), false);
});

test("salvarea păstrează variantele doar cu câmpurile rândului — de-asta le cere și serverul", () => {
  const campuri = campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "vanzare" });
  const salvat = catreStocare(catreEditor(DATE, campuri), campuri);
  assert.deepEqual(salvat.elemente[0].variante, DATE.elemente[0].variante);
  // Cu descrierea simplă a secțiunii, variantele s-ar pierde la prima salvare.
  assert.equal(catreStocare(catreEditor(DATE, PORTFOLIO.campuri), PORTFOLIO.campuri).elemente[0].variante, undefined);

  const actiune = citeste("src/app/dashboard/sectiuni/actions.ts");
  assert.match(actiune, /campuriPentruRand\(meta, \{ variant: rand\.variant/);
  assert.match(actiune, /catreStocare\(catreEditor\(date, campuri\), campuri\)/);
  const pagina = citeste("src/app/dashboard/sectiuni/[id]/page.tsx");
  assert.match(pagina, /catreEditor\(continut, campuri\)/);
  assert.match(pagina, /meta=\{\{ \.\.\.meta, campuri \}\}/);
});

test("culoarea și fonturile: doar din listele din „Aspect”; altceva nu trece de server", () => {
  const campuri = campuriPentruRand(PORTFOLIO, { variant: "vitrina", tipSite: "vanzare" });
  const cu = (varianta) => catreEditor({ ...DATE, elemente: [{ ...DATE.elemente[0], variante: [varianta] }] }, campuri);

  assert.deepEqual(valideaza(cu({ culoare: "Safir Mat", fonturi: "Elegant" }), campuri), {});
  assert.deepEqual(valideaza(cu({}), campuri), {}, "fără culoare și fonturi alese se poate salva");
  const erori = valideaza(cu({ culoare: "Roz bombon", fonturi: "<b>Orice</b>" }), campuri);
  assert.ok(erori["elemente.0.variante.0.culoare"]);
  assert.ok(erori["elemente.0.variante.0.fonturi"]);

  // Mai multe decât încap: refuzat și pe server, nu doar oprit de butonul „+ Adaugă”.
  const multe = Array.from({ length: MAX_VARIANTE_MODEL + 1 }, () => ({ culoare: "Safir" }));
  assert.ok(valideaza(cu(multe[0]), campuri)["elemente.0.variante"] === undefined);
  const preaMulte = catreEditor({ ...DATE, elemente: [{ ...DATE.elemente[0], variante: multe }] }, campuri);
  assert.ok(valideaza(preaMulte, campuri)["elemente.0.variante"]);
});

test("listele sunt chiar cele din „Aspect”: 24 de culori, perechile de fonturi", () => {
  assert.deepEqual(CULORI_VARIANTA.map((c) => c.nume), [...PRESETURI_MATASOASE, ...PRESETURI_MATE].map((c) => c.nume));
  assert.equal(new Set(CULORI_VARIANTA.map((c) => c.nume)).size, 24);
  assert.deepEqual(FONTURI_VARIANTA, PERECHI_FONTURI.map((p) => p.nume));
});

test("eticheta de pe poză și bulina", () => {
  assert.equal(etichetaVariantei({ culoare: "Safir", fonturi: "Modern" }), "Safir · Modern");
  assert.equal(etichetaVariantei({ culoare: "Oliv Mat" }), "Oliv Mat");
  assert.equal(etichetaVariantei({ fonturi: "Elegant" }), "Elegant");
  assert.equal(etichetaVariantei({}), TEXTE_VANZARE.variante.faraNume);
  // Un nume care nu e în liste nu ajunge pe poză.
  assert.equal(etichetaVariantei({ culoare: "<script>", fonturi: "Modern" }), "Modern");

  assert.deepEqual(culoareaVariantei("Safir"), { hex: "#0A3463", matasos: true });
  assert.deepEqual(culoareaVariantei("Safir Mat"), { hex: "#163659", matasos: false });
  assert.equal(culoareaVariantei("Roz"), null);
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

test("animația: stă pe loc la mișcare redusă, sub maus, în afara ecranului și după o alegere", () => {
  const cod = citeste("src/components/site/sections/cadre-vitrina.tsx");
  assert.match(cod, /prefers-reduced-motion: reduce/);
  assert.match(cod, /if \(numar < 2 \|\| !peEcran \|\| subMaus \|\| aleasDeOm \|\| miscareRedusa\) return;/);
  // Bulinele sunt butoane cu nume citit, nu puse în linkul demo-ului.
  assert.match(cod, /type="button"/);
  assert.match(cod, /aria-label=\{`\$\{TEXTE_VANZARE\.variante\.arata\}: \$\{cadru\.eticheta\}`\}/);
});
