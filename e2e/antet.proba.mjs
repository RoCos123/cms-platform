import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { esteDespreVizibila, linkuriImplicite } from "@/lib/antet";
import { ANCORE_SECTIUNI } from "@/lib/destinatii";

/**
 * Proba meniului implicit din antet. `pnpm test:logica`.
 *
 * Ce apără: o intrare din meniu care duce la un loc inexistent. Pe sitepsihologi.ro
 * „Despre mine" era oprit, iar „Despre" din bară nu făcea nimic — doar punea
 * `#despre` în adresă. Pe site arată a defect, iar clientul nu are cum să afle de ce.
 */

const fara = { paginaServicii: false, blog: null, paginiProprii: [] };

test("„Despre” apare doar când secțiunea „Despre mine” e pornită", () => {
  const cu = linkuriImplicite({ ...fara, areDespre: true });
  const faraDespre = linkuriImplicite({ ...fara, areDespre: false });

  assert.equal(cu[0].text, "Despre");
  assert.ok(!faraDespre.some((link) => link.text === "Despre"), "linkul n-ar trebui să existe");
  assert.ok(!faraDespre.some((link) => link.href.includes("despre")), "nici adresa lui");
});

test("restul meniului rămâne neschimbat când „Despre” lipsește", () => {
  const cu = linkuriImplicite({ ...fara, areDespre: true });
  const faraDespre = linkuriImplicite({ ...fara, areDespre: false });

  assert.deepEqual(faraDespre, cu.slice(1));
  assert.deepEqual(
    faraDespre.map((link) => link.text),
    ["Servicii", "Contact"],
  );
});

test("linkul „Despre” duce chiar la ancora pe care o pune secțiunea", () => {
  const [despre] = linkuriImplicite({ ...fara, areDespre: true });
  assert.equal(despre.href, `/#${ANCORE_SECTIUNI.aboutTeaser.ancora}`);

  // Ancora din secțiune e scrisă în componentă; cele două nu trebuie să se despartă.
  const componenta = readFileSync("src/components/site/sections/about-teaser.tsx", "utf8");
  assert.ok(
    componenta.includes(`id="${ANCORE_SECTIUNI.aboutTeaser.ancora}"`),
    "about-teaser.tsx nu mai pune ancora la care duce meniul",
  );
});

test("esteDespreVizibila se uită la cheia secțiunii, nu la altceva", () => {
  assert.equal(esteDespreVizibila(["hero", "aboutTeaser", "contact"]), true);
  assert.equal(esteDespreVizibila(["hero", "features", "contact"]), false);
  assert.equal(esteDespreVizibila([]), false);
});

test("ordinea și adresele rămân cele de dinainte", () => {
  const linkuri = linkuriImplicite({
    areDespre: true,
    paginaServicii: true,
    blog: "pagina",
    paginiProprii: [{ text: "Tarife", href: "/tarife" }],
  });

  assert.deepEqual(linkuri, [
    { text: "Despre", href: "/#despre" },
    { text: "Servicii", href: "/servicii" },
    { text: "Blog", href: "/blog" },
    { text: "Tarife", href: "/tarife" },
    { text: "Contact", href: "/#contact" },
  ]);

  // Fără pagina de servicii, „Servicii” coboară pe prima pagină; blogul fără pagină la fel.
  const simplu = linkuriImplicite({ ...fara, areDespre: true, blog: "sectiune" });
  assert.equal(simplu.find((l) => l.text === "Servicii").href, "/#servicii");
  assert.equal(simplu.find((l) => l.text === "Blog").href, "/#articole");

  // Regula veche: adresele încep cu „/”, ca să meargă și de pe alte pagini.
  for (const link of linkuri) assert.ok(link.href.startsWith("/"), link.href);
});

test("site-ul public dă antetului ce secțiuni sunt pornite", () => {
  const cadru = readFileSync("src/components/site/cadru-site.tsx", "utf8");
  assert.ok(cadru.includes("areDespre: esteDespreVizibila("), "cadru-site.tsx nu mai trece areDespre");

  // Fără asta, cineva ar putea pune la loc un „Despre” scris de mână în antet.
  const antet = readFileSync("src/components/site/header.tsx", "utf8");
  assert.ok(!antet.includes('text: "Despre"'), "header.tsx are iar un „Despre” scris de mână");
});
