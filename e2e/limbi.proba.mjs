import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LIMBI_SITE,
  adresaInLimba,
  adresaPeTradusa,
  esteGazdaTradusa,
  gazdaOriginala,
  gazdaTradusa,
  limbaPaginii,
} from "@/lib/traducere";
import { limbileSuntPornite, paginaEsteActiva } from "@/lib/setari";

/**
 * Alegerea limbii de pe site-ul public (RO · EN · DE, prin traducerea Google). `pnpm test:logica`.
 *
 * Cerută de proprietar pe 21 oct. 2026. Ce apără probele:
 *
 * 1. ADRESA pe care o deschide EN/DE e exact forma încercată de proprietar pe
 *    `model-apropiere` și care a mers (`…translate.goog/servicii?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en`);
 * 2. NAVIGAREA pe pagina tradusă: un link al site-ului primește coada de limbă a paginii
 *    curente — fără ea, Google răspunde „Can't translate this page" (proba proprietarului);
 *    linkurile care nu sunt ale site-ului rămân neatinse;
 * 3. BIFA e oprită din oficiu și nu schimbă comutatoarele paginilor;
 * 4. LEGĂTURILE din cod: comutatorul apare doar cu bifa, repararea navigării nu face nimic
 *    pe domeniul site-ului, iar politica de confidențialitate are paragraful despre traducere.
 */

const citeste = (cale) => readFileSync(new URL(`../${cale}`, import.meta.url), "utf8");

test("gazda tradusă: liniuța se dublează, punctul devine liniuță, și înapoi", () => {
  assert.equal(gazdaTradusa("model-apropiere.vercel.app"), "model--apropiere-vercel-app.translate.goog");
  assert.equal(gazdaTradusa("sitepsihologi.ro"), "sitepsihologi-ro.translate.goog");
  assert.equal(gazdaTradusa("Cabinet-Ana.RO"), "cabinet--ana-ro.translate.goog");

  for (const domeniu of [
    "model-apropiere.vercel.app",
    "sitepsihologi.vercel.app",
    "www.cabinet-ana-pop.ro",
    "psiholog--dublu.ro",
    "xn--psiholog-9za.ro",
  ]) {
    const tradusa = gazdaTradusa(domeniu);
    assert.ok(esteGazdaTradusa(tradusa), tradusa);
    assert.equal(gazdaOriginala(tradusa), domeniu, `dus-întors pentru ${domeniu}`);
  }

  assert.equal(gazdaOriginala("model-apropiere.vercel.app"), null);
  assert.equal(esteGazdaTradusa("translate.google.com"), false);
});

test("EN și DE duc la traducerea Google a aceleiași pagini; RO, la pagina noastră", () => {
  // Exact adresa încercată de proprietar pe 21 oct., cu care pagina de servicii s-a tradus.
  assert.equal(
    adresaInLimba("model-apropiere.vercel.app", "/servicii", "en"),
    "https://model--apropiere-vercel-app.translate.goog/servicii?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en",
  );
  assert.equal(
    adresaInLimba("model-apropiere.vercel.app", "/", "de"),
    "https://model--apropiere-vercel-app.translate.goog/?_x_tr_sl=ro&_x_tr_tl=de&_x_tr_hl=de",
  );
  assert.equal(adresaInLimba("model-apropiere.vercel.app", "/blog", "ro"), "https://model-apropiere.vercel.app/blog");

  // Parametrii site-ului rămân; coada veche a Google se scoate (EN → DE nu lasă două limbi).
  assert.equal(
    adresaInLimba("cabinet.ro", "/blog?pagina=2&_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en&_x_tr_pto=wapp", "de"),
    "https://cabinet-ro.translate.goog/blog?pagina=2&_x_tr_sl=ro&_x_tr_tl=de&_x_tr_hl=de",
  );
  assert.equal(
    adresaInLimba("cabinet.ro", "/blog?pagina=2&_x_tr_sl=ro&_x_tr_tl=en", "ro"),
    "https://cabinet.ro/blog?pagina=2",
  );

  // Ancora nu trece (ar lipi pagina de un loc din ea), iar portul de pe banc nu ajunge la Google.
  assert.equal(
    adresaInLimba("ana.test:3000", "/servicii#consiliere", "en"),
    "https://ana-test.translate.goog/servicii?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en",
  );
});

test("limba paginii: română pe domeniul nostru, limba din coadă pe gazda tradusă", () => {
  assert.equal(limbaPaginii("cabinet.ro", "?_x_tr_tl=en"), "ro");
  assert.equal(limbaPaginii("cabinet-ro.translate.goog", "?_x_tr_sl=ro&_x_tr_tl=de&_x_tr_hl=de"), "de");
  // O limbă aleasă din bara Google, care nu e în comutator: nicio limbă marcată.
  const fr = limbaPaginii("cabinet-ro.translate.goog", "?_x_tr_sl=ro&_x_tr_tl=fr");
  assert.equal(fr, "fr");
  assert.ok(!LIMBI_SITE.some((limba) => limba.cod === fr));
});

test("pe pagina tradusă, linkurile site-ului păstrează coada de limbă", () => {
  const acasa = "https://model--apropiere-vercel-app.translate.goog/?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en";
  const coada = "_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en";

  // Cazul găsit de proprietar: meniul duce la `/servicii`, fără coadă.
  assert.equal(
    adresaPeTradusa("/servicii", acasa),
    `https://model--apropiere-vercel-app.translate.goog/servicii?${coada}`,
  );
  // Link scris cu domeniul site-ului întreg: tot al site-ului, deci tot prin traducere.
  assert.equal(
    adresaPeTradusa("https://model-apropiere.vercel.app/blog/primul", acasa),
    `https://model--apropiere-vercel-app.translate.goog/blog/primul?${coada}`,
  );
  // Ancora de pe aceeași pagină rămâne aceeași pagină (browserul doar derulează).
  assert.equal(adresaPeTradusa("#contact", acasa), `${acasa}#contact`);
  assert.equal(adresaPeTradusa("/#contact", acasa), `${acasa}#contact`);
  // Un link deja rescris de Google nu primește coada de două ori.
  assert.equal(
    adresaPeTradusa(`https://model--apropiere-vercel-app.translate.goog/servicii?${coada}`, acasa),
    `https://model--apropiere-vercel-app.translate.goog/servicii?${coada}`,
  );
  // Parametrii site-ului rămân, coada vine de la pagina curentă.
  assert.equal(
    adresaPeTradusa("/blog?pagina=2", acasa),
    `https://model--apropiere-vercel-app.translate.goog/blog?pagina=2&${coada}`,
  );
});

test("linkurile care nu sunt ale site-ului, și pagina netradusă, rămân neatinse", () => {
  const acasa = "https://model--apropiere-vercel-app.translate.goog/?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en";

  assert.equal(adresaPeTradusa("https://wa.me/40722333444", acasa), null);
  assert.equal(adresaPeTradusa("https://www.facebook.com/cabinet", acasa), null);
  assert.equal(adresaPeTradusa("mailto:ana@cabinet.ro", acasa), null);
  assert.equal(adresaPeTradusa("tel:0722333444", acasa), null);
  // Alt site tradus tot prin Google nu e al nostru.
  assert.equal(adresaPeTradusa("https://alt-site-ro.translate.goog/", acasa), null);
  // Pe domeniul nostru nu e nimic de reparat.
  assert.equal(adresaPeTradusa("/servicii", "https://model-apropiere.vercel.app/"), null);
});

test("bifa limbilor e oprită din oficiu și nu atinge comutatoarele paginilor", () => {
  assert.equal(limbileSuntPornite(undefined), false);
  assert.equal(limbileSuntPornite(null), false);
  assert.equal(limbileSuntPornite({}), false);
  assert.equal(limbileSuntPornite({ servicii: true, blog: true }), false);
  assert.equal(limbileSuntPornite({ limbi: false }), false);
  assert.equal(limbileSuntPornite({ limbi: true }), true);

  // Paginile rămân pornite din oficiu, oricum ar sta limbile.
  assert.equal(paginaEsteActiva({ limbi: true }, "blog"), true);
  assert.equal(paginaEsteActiva({ limbi: false }, "servicii"), true);
});

test("legăturile din cod: comutatorul doar cu bifa, repararea doar pe gazda tradusă", () => {
  const cadru = citeste("src/components/site/cadru-site.tsx");
  assert.match(cadru, /domeniuLimbi: limbileSuntPornite\(pagini\) \? domain : undefined/);
  assert.match(cadru, /<NavigareTradusa \/>/);

  const navigare = citeste("src/components/site/navigare-tradusa.tsx");
  // Prima instrucțiune din efect: pe domeniul site-ului, ieșire imediată.
  assert.match(navigare, /useEffect\(\(\) => \{\s*if \(!esteGazdaTradusa\(window\.location\.hostname\)\) return;/);
  // Captură pe `window`, ca să ajungă înaintea navigării rapide din Next.
  assert.match(navigare, /window\.addEventListener\("click", laClic, true\)/);

  const comutator = citeste("src/components/site/comutator-limba.tsx");
  assert.match(comutator, /translate="no"/);
  assert.match(comutator, /data-adresa=\{adresa\}/);
  // Nimic încărcat de la Google: doar linkuri, niciun script.
  assert.doesNotMatch(comutator, /<script|translate_a|translate\.google\.com/);
  // Lista stă mereu în pagină și doar se ascunde: deschiderea nu mută noduri pe sub traducere.
  assert.match(comutator, /hidden=\{!deschis\}/);

  // O singură bulină, în afara rândului de linkuri: se vede și pe telefon, lângă ☰.
  const nav = citeste("src/components/site/header-nav.tsx");
  assert.equal(nav.match(/<ComutatorLimba/g)?.length, 1);
  assert.ok(nav.indexOf("<ComutatorLimba") > nav.indexOf("</nav>"), "bulina e după rândul de linkuri, nu în el");
});

test("steagurile sunt desenate, nu emoji (pe Windows emoji-urile de steag ies ca litere)", () => {
  const steaguri = citeste("src/components/site/steaguri.tsx");
  // Literele-indicator regionale (🇷🇴 = U+1F1F7 U+1F1F4 etc.) din care se fac steagurile emoji.
  assert.doesNotMatch(steaguri, /[\u{1F1E6}-\u{1F1FF}]/u);
  for (const cod of ["ro", "de"]) assert.match(steaguri, new RegExp(`cod === "${cod}"`));
  // Culorile oficiale, ca un steag greșit să nu treacă neobservat.
  for (const culoare of ["#002B7F", "#FCD116", "#CE1126", "#DD0000", "#FFCE00", "#012169", "#C8102E"]) {
    assert.ok(steaguri.includes(culoare), culoare);
  }
  assert.deepEqual(
    LIMBI_SITE.map((limba) => limba.nume),
    ["Română", "English", "Deutsch"],
    "numele limbii, scris în limba ei, stă lângă steag",
  );
});

test("politica de confidențialitate are paragraful despre traducere", () => {
  const politica = citeste("sabloane/politica-de-confidentialitate.md");
  assert.match(politica, /\| `\[TRADUCERE\]` \|/);
  const paragraf = politica.split("\n").find((rand) => rand.startsWith("[TRADUCERE] "));
  assert.ok(paragraf, "paragraful [TRADUCERE] lipsește");
  assert.match(paragraf, /translate\.goog/);
  assert.match(paragraf, /nu se încarcă nimic de la Google/);
  assert.match(paragraf, /formular/);
});
