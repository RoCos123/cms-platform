import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { esteDespreVizibila, linkPachete, linkuriImplicite } from "@/lib/antet";
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

/*
 * Linkul „Prețuri” din bară (8 oct. 2026): îl cere secțiunea „Pachete”, printr-un câmp
 * opțional. Apărarea e dublă — să nu apară unde nu l-a cerut nimeni, și să nu ducă în gol.
 */

const pachete = [{ nume: "Site complet", pret: "300 €" }];

test("„Prețuri” apare când textul e scris și există măcar un pachet", () => {
  const link = linkPachete({ linkMeniu: "Prețuri", pachete });
  assert.deepEqual(link, { text: "Prețuri", href: "/#pachete" });
});

test("textul se curăță de spații; spațiile singure nu fac un link", () => {
  assert.equal(linkPachete({ linkMeniu: "  Tarife  ", pachete }).text, "Tarife");
  assert.equal(linkPachete({ linkMeniu: "   ", pachete }), null);
  assert.equal(linkPachete({ linkMeniu: "", pachete }), null);
});

test("fără text în câmp nu apare nimic — adică la niciun client care n-a cerut", () => {
  assert.equal(linkPachete({ pachete }), null);
  assert.equal(linkPachete({ titlu: "Pachete", pachete }), null);
});

test("fără niciun pachet nu apare: secțiunea nu se afișează, linkul ar duce în gol", () => {
  assert.equal(linkPachete({ linkMeniu: "Prețuri", pachete: [] }), null);
  assert.equal(linkPachete({ linkMeniu: "Prețuri" }), null);
  assert.equal(linkPachete({ linkMeniu: "Prețuri", pachete: "nu e listă" }), null);
});

test("date stricate sau lipsă nu aruncă și nu produc link", () => {
  for (const stricat of [null, undefined, "text", 42, [], { linkMeniu: 7, pachete }]) {
    assert.equal(linkPachete(stricat), null);
  }
});

test("linkul din secțiune stă după „Servicii”, înaintea blogului și a lui „Contact”", () => {
  const linkuri = linkuriImplicite({
    areDespre: false,
    paginaServicii: true,
    blog: "pagina",
    paginiProprii: [],
    linkuriSectiuni: [{ text: "Prețuri", href: "/#pachete" }],
  });
  assert.deepEqual(
    linkuri.map((l) => l.text),
    ["Servicii", "Prețuri", "Blog", "Contact"],
  );
});

test("linkul duce la ancora pe care o pune secțiunea „Pachete”", () => {
  const componenta = readFileSync("src/components/site/sections/pricing.tsx", "utf8");
  assert.ok(componenta.includes('id="pachete"'), "pricing.tsx nu mai pune ancora #pachete");
});

test("câmpul există în schema „Pachete”, altfel panoul ar șterge textul la salvare", () => {
  const schema = readFileSync("src/lib/sectiuni.ts", "utf8");
  const pricing = schema.slice(schema.indexOf('cheie: "pricing"'), schema.indexOf('cheie: "testimonials"'));
  assert.ok(pricing.includes('cheie: "linkMeniu"'), "linkMeniu a dispărut din schema Pachete");
  // Câmpul nu trebuie pus în nicio altă secțiune: ar fi un link în bară cerut de oricine.
  assert.equal(schema.split('cheie: "linkMeniu"').length - 1, 1);
});

test("site-ul public trece antetului linkul secțiunii", () => {
  const cadru = readFileSync("src/components/site/cadru-site.tsx", "utf8");
  assert.ok(cadru.includes("linkuriSectiuni:"), "cadru-site.tsx nu mai trece linkuriSectiuni");
  assert.ok(cadru.includes("dateleSectiuniiPachete("), "cadru-site.tsx nu mai citește secțiunea Pachete");
});
