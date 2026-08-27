import assert from "node:assert/strict";
import test from "node:test";
import { intrarileSitemapului } from "@/lib/sitemap-reguli";

/**
 * Proba regulilor de sitemap, fără server și fără Supabase.
 *
 * Se rulează cu:
 *   pnpm test:logica
 *
 * Ce apără fiecare test e scris în titlul lui. Toate pleacă de la aceeași
 * regulă: în sitemap intră EXACT ce răspunde cu 200 pe site. O adresă în plus
 * trimite Google într-un 404; una în minus ține o pagină în afara căutărilor.
 */

const BAZA = new URL("https://cabinet-exemplu.ro");

function continut(peste = {}) {
  return {
    pagini: {},
    modificareaPrimeiPagini: "2026-08-20T10:00:00.000Z",
    ultimaModificareServicii: "2026-08-21T10:00:00.000Z",
    articole: [],
    paginiProprii: [],
    ...peste,
  };
}

const adrese = (intrari) => intrari.map((intrare) => intrare.url);

const DOUA_ARTICOLE = [
  { slug: "anxietatea-la-adulti", updated_at: "2026-08-25T09:00:00.000Z" },
  { slug: "prima-sedinta", updated_at: "2026-08-10T09:00:00.000Z" },
];

test("prima pagină e mereu prima în sitemap, pe domeniul clientului", () => {
  // Prima pagină nu are comutator: există și pe un site din care s-a oprit tot
  // restul. Aici se verifică doar ea — ce aduc comutatoarele e testat mai jos.
  const totOprit = continut({ pagini: { servicii: false, blog: false } });

  assert.deepEqual(adrese(intrarileSitemapului(BAZA, totOprit)), [
    "https://cabinet-exemplu.ro/",
  ]);
  assert.equal(intrarileSitemapului(BAZA, continut())[0].url, "https://cabinet-exemplu.ro/");
});

test("niciodată localhost — bug-ul originalului", () => {
  const intrari = intrarileSitemapului(BAZA, continut({ articole: DOUA_ARTICOLE }));

  for (const adresa of adrese(intrari)) {
    assert.ok(
      adresa.startsWith("https://cabinet-exemplu.ro/"),
      `adresă care nu e pe domeniul clientului: ${adresa}`,
    );
  }
});

test("fără comutator atins, serviciile și blogul sunt pornite", () => {
  // `paginaEsteActiva` tratează lipsa valorii ca PORNIT: cine n-a atins
  // comutatorul are site-ul așa cum i l-am construit.
  const intrari = intrarileSitemapului(BAZA, continut({ articole: DOUA_ARTICOLE }));

  assert.deepEqual(adrese(intrari), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/servicii",
    "https://cabinet-exemplu.ro/blog",
    "https://cabinet-exemplu.ro/blog/anxietatea-la-adulti",
    "https://cabinet-exemplu.ro/blog/prima-sedinta",
  ]);
});

test("blogul oprit scoate ȘI pagina, ȘI toate articolele", () => {
  // Ăsta e testul care contează cel mai mult: un articol rămas în sitemap după
  // ce clientul a oprit blogul e o adresă care răspunde 404. Sitemap-ul l-ar
  // trimite pe Google direct în ea, la fiecare trecere.
  const intrari = intrarileSitemapului(
    BAZA,
    continut({ pagini: { blog: false }, articole: DOUA_ARTICOLE }),
  );

  assert.deepEqual(adrese(intrari), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/servicii",
  ]);
});

test("serviciile oprite scot /servicii", () => {
  const intrari = intrarileSitemapului(
    BAZA,
    continut({ pagini: { servicii: false, blog: false } }),
  );

  assert.deepEqual(adrese(intrari), ["https://cabinet-exemplu.ro/"]);
});

test("paginile proprii primite intră toate", () => {
  // Cele puse pe „Nicăieri” sunt deja excluse de interogare, nu aici — vezi
  // `paginiPentruSitemap` din src/app/sitemap.ts.
  const intrari = intrarileSitemapului(
    BAZA,
    continut({
      pagini: { servicii: false, blog: false },
      paginiProprii: [
        { slug: "tarife", updated_at: "2026-08-01T00:00:00.000Z" },
        { slug: "politica-de-confidentialitate", updated_at: null },
      ],
    }),
  );

  assert.deepEqual(adrese(intrari), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/tarife",
    "https://cabinet-exemplu.ro/politica-de-confidentialitate",
  ]);
});

test("data lipsă rămâne lipsă, nu devine „acum”", () => {
  // O dată inventată i-ar spune lui Google că pagina s-a schimbat la fiecare
  // trecere, adică ar face câmpul inutil tocmai unde chiar contează.
  const [pagina] = intrarileSitemapului(
    BAZA,
    continut({
      pagini: { servicii: false, blog: false },
      modificareaPrimeiPagini: undefined,
    }),
  );

  assert.equal(pagina.lastModified, undefined);
});

test("data ultimei modificări ajunge pe adresa potrivită", () => {
  const intrari = intrarileSitemapului(
    BAZA,
    continut({ pagini: { servicii: false }, articole: DOUA_ARTICOLE }),
  );

  const dupaAdresa = Object.fromEntries(intrari.map((i) => [i.url, i.lastModified]));

  assert.equal(dupaAdresa["https://cabinet-exemplu.ro/"], "2026-08-20T10:00:00.000Z");
  // Pagina de blog poartă data celui mai recent modificat articol.
  assert.equal(dupaAdresa["https://cabinet-exemplu.ro/blog"], "2026-08-25T09:00:00.000Z");
  assert.equal(
    dupaAdresa["https://cabinet-exemplu.ro/blog/prima-sedinta"],
    "2026-08-10T09:00:00.000Z",
  );
});

test("pagina de programare intră doar când se pot cere ore", () => {
  const fara = continut({ pagini: { servicii: false, blog: false } });

  assert.deepEqual(adrese(intrarileSitemapului(BAZA, fara)), ["https://cabinet-exemplu.ro/"]);
  assert.deepEqual(adrese(intrarileSitemapului(BAZA, { ...fara, areProgramari: true })), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/programare",
  ]);
});

test("un slug cu diacritice se codează, nu rupe adresa", () => {
  const intrari = intrarileSitemapului(
    BAZA,
    continut({
      pagini: { servicii: false, blog: false },
      paginiProprii: [{ slug: "ședințe-online", updated_at: null }],
    }),
  );

  assert.deepEqual(adrese(intrari), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/%C8%99edin%C8%9Be-online",
  ]);
});

test("blogul pornit fără niciun articol scoate pagina, dar nicio adresă de articol", () => {
  const intrari = intrarileSitemapului(BAZA, continut({ pagini: { servicii: false } }));

  assert.deepEqual(adrese(intrari), [
    "https://cabinet-exemplu.ro/",
    "https://cabinet-exemplu.ro/blog",
  ]);
});
