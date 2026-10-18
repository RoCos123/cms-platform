import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTemplate, listTemplates, templateStyle } from "@/lib/templates";
import {
  contrast,
  esteHexValid,
  hexDinOklch,
  luminanta,
  normalizeazaHex,
  oklchDinHex,
} from "@/lib/aspect/culoare";
import { PRAG_CONTRAST, paletaDinCuloare, perechiDeContrast, verificaPerechi } from "@/lib/aspect/paleta";
import {
  ROLURI_MANUALE,
  citesteAspectCulori,
  culoriDinBrand,
  paletaEfectiva,
} from "@/lib/aspect/culori";
import { PRESETURI_CULOARE, brandCuCulori, valideazaCulori } from "@/lib/aspect/salvare";
import { DOMENII_CU_ASPECT, SABLOANE_CU_ASPECT, aspectPermis, culoriPermise } from "@/lib/aspect/acces";

/**
 * Culorile alese de client (meniul „Aspect”). `pnpm test:logica`.
 *
 * Cerut de proprietar (18 oct. 2026): clientul alege O culoare, iar restul paletei se
 * calculează din ea — inclusiv fundalurile —, cu lizibilitatea garantată; în modul manual
 * își alege singur fiecare culoare și își asumă. Ce apără probele:
 *
 * 1. LIZIBILITATEA, pe sute de culori la întâmplare, pe toate cele cinci șabloane: fiecare
 *    pereche text–fundal care apare pe ecran trece 4,5:1. Lista perechilor e scrisă și aici,
 *    independent de cod (aceeași ca în `contrast-sabloane.proba.mjs`), ca o greșeală din
 *    `perechiDeContrast` să nu se ascundă singură;
 * 2. CARACTERUL ȘABLONULUI: un fundal deschis rămâne deschis, unul închis rămâne închis,
 *    „Claritate” își păstrează albul pur, erorile rămân roșii;
 * 3. SITE-URILE FĂRĂ CULORI PROPRII nu se schimbă deloc: `getTemplate` întoarce chiar obiectul
 *    șablonului, nu o copie;
 * 4. un JSON stricat din bază nu strică site-ul; 5. modul manual aplică exact ce a ales omul
 *    și îi arată avertismente, nu îl oprește.
 */

/** Generator pseudo-aleator cu sămânță: aceleași „întâmplări” la fiecare rulare, ca o pică să se poată reproduce. */
function mulberry32(sameanta) {
  let a = sameanta;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex2 = (v) => v.toString(16).padStart(2, "0").toUpperCase();

/** Culori care strică de obicei lucrurile + câteva sute la întâmplare. */
function culoriDeProba(cate = 360) {
  const fixe = [
    "#000000", "#FFFFFF", "#808080", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
    "#FFEB3B", "#FFC107", "#CDDC39", "#E91E63", "#2E7D5B", "#1D5C99", "#795548", "#9C27B0", "#FF5722",
    "#F5F5F5", "#0A0A0A", "#FAF3E0", "#FFFFFE", "#010101", "#7F7F7F", "#FEFE00", "#00FEFE",
  ];
  const rnd = mulberry32(20261018);
  const aleatoare = Array.from({ length: cate }, () => `#${hex2(Math.floor(rnd() * 256))}${hex2(Math.floor(rnd() * 256))}${hex2(Math.floor(rnd() * 256))}`);
  return [...fixe, ...aleatoare];
}

const CULORI = culoriDeProba();

/** Perechile care apar pe ecran — copiate din proba șabloanelor, nu importate din cod. */
function perechiIndependente(p) {
  const lista = [];
  for (const [numeFundal, fundal] of [["fundal", p.fundal], ["fundalNuantat", p.fundalNuantat], ["fundalRelief", p.fundalRelief]]) {
    for (const rol of ["text", "textSecundar", "accent", "eroare"]) lista.push([`${rol} pe ${numeFundal}`, p[rol], fundal]);
  }
  lista.push(["accentText pe accent", p.accentText, p.accent]);
  for (const rol of ["textPeInchis", "textSecundarPeInchis", "accentPeInchis", "eroarePeInchis"]) {
    lista.push([`${rol} pe fundalInchis`, p[rol], p.fundalInchis]);
  }
  return lista;
}

// ───────────────────────── matematica culorilor ─────────────────────────

test("OKLCH dus-întors: orice culoare #RRGGBB revine exact", () => {
  for (const hex of CULORI) {
    assert.equal(hexDinOklch(oklchDinHex(hex)), hex, hex);
  }
});

test("contrastul e cel WCAG, la fel ca în proba șabloanelor", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(2), "21.00");
  assert.equal(contrast("#FFFFFF", "#FFFFFF").toFixed(2), "1.00");
  assert.equal(contrast("#FFFFFF", "#000000"), contrast("#000000", "#FFFFFF"), "contrastul nu depinde de ordine");
  // Valoarea cunoscută a accentului „Căldură” pe alb (măsurată în comentariul din șablon: 6,35).
  assert.equal(contrast("#904D39", "#FFFFFF").toFixed(2), "6.35");
  assert.ok(luminanta("#FFFFFF") > luminanta("#808080") && luminanta("#808080") > luminanta("#000000"));
});

test("doar #RRGGBB e o culoare: nimic altceva nu intră", () => {
  assert.equal(normalizeazaHex(" #2e7d5b "), "#2E7D5B");
  for (const rau of ["#abc", "2E7D5B", "rosu", "rgb(1,2,3)", "#GGGGGG", "#2E7D5B00", "", null, undefined, 7, {}, []]) {
    assert.equal(normalizeazaHex(rau), null, String(rau));
    assert.equal(esteHexValid(rau), false, String(rau));
  }
});

// ───────────────────────── paleta calculată ─────────────────────────

for (const sablon of listTemplates()) {
  test(`„${sablon.nume}”: pe ${CULORI.length} de culori, TOATE perechile text–fundal trec ${PRAG_CONTRAST}:1`, () => {
    const slabe = [];
    for (const culoare of CULORI) {
      const { paleta } = paletaDinCuloare(sablon.paleta, culoare);
      for (const [nume, text, fundal] of perechiIndependente(paleta)) {
        const raport = contrast(text, fundal);
        if (raport < PRAG_CONTRAST) slabe.push(`${culoare} → ${nume}: ${raport.toFixed(2)}:1 (${text} pe ${fundal})`);
      }
    }
    assert.deepEqual(slabe.slice(0, 12), [], `${slabe.length} perechi slabe:\n  ${slabe.slice(0, 12).join("\n  ")}`);
  });

  test(`„${sablon.nume}”: șablonul își păstrează caracterul oricare ar fi culoarea aleasă`, () => {
    for (const culoare of CULORI) {
      const { paleta } = paletaDinCuloare(sablon.paleta, culoare);

      // Fundalul deschis rămâne deschis, cel închis închis (aceleași praguri ca în proba șabloanelor).
      assert.ok(luminanta(paleta.fundal) > 0.5, `${culoare}: fundal nu mai e deschis (${paleta.fundal})`);
      assert.ok(luminanta(paleta.fundalInchis) < 0.15, `${culoare}: fundalInchis nu mai e închis (${paleta.fundalInchis})`);

      // Luminozitatea fundalurilor rămâne a șablonului (rotunjirea și decolorarea în sRGB ierte).
      for (const rol of ["fundal", "fundalNuantat", "fundalRelief", "fundalInchis"]) {
        const dorit = oklchDinHex(sablon.paleta[rol]).l;
        const obtinut = oklchDinHex(paleta[rol]).l;
        assert.ok(Math.abs(dorit - obtinut) < 0.03, `${culoare}: ${rol} și-a schimbat luminozitatea (${dorit.toFixed(3)} → ${obtinut.toFixed(3)})`);
      }

      // Roșul erorilor rămâne roșu: o eroare verde ar fi o minciună.
      const h = oklchDinHex(paleta.eroare).h;
      assert.ok(h < 50 || h > 350, `${culoare}: eroarea nu mai e roșie (h=${h.toFixed(0)})`);

      // Toate rolurile sunt culori valide.
      for (const [rol, valoare] of Object.entries(paleta)) assert.ok(esteHexValid(valoare), `${culoare}: ${rol} = ${valoare}`);
    }
  });
}

test("fundalurile iau nuanța culorii alese — nu doar accentul", () => {
  const caldura = getTemplate("caldura").paleta;
  const { paleta } = paletaDinCuloare(caldura, "#2E7D5B"); // verde, h ≈ 162
  for (const rol of ["fundal", "fundalNuantat", "fundalRelief", "fundalInchis", "text"]) {
    const o = oklchDinHex(paleta[rol]);
    assert.ok(o.c > 0.004, `${rol} a rămas fără nicio tentă`);
    assert.ok(Math.abs(o.h - 162) < 12, `${rol}: nuanța ${o.h.toFixed(0)} nu urmează verdele (162)`);
  }
  // Și șablonul nu mai are tenta lui crem (h ≈ 68).
  assert.ok(Math.abs(oklchDinHex(paleta.fundal).h - 68) > 40);
});

test("„Claritate” își păstrează albul pur, oricare ar fi culoarea", () => {
  const claritate = getTemplate("claritate").paleta;
  assert.equal(claritate.fundalNuantat, "#FFFFFF");
  for (const culoare of ["#2E7D5B", "#E91E63", "#FFEB3B", "#808080"]) {
    assert.equal(paletaDinCuloare(claritate, culoare).paleta.fundalNuantat, "#FFFFFF", culoare);
  }
});

test("o culoare destul de închisă rămâne EXACT culoarea aleasă; una prea deschisă se întunecă și se spune", () => {
  for (const sablon of listTemplates()) {
    const buna = paletaDinCuloare(sablon.paleta, "#1D3557");
    assert.equal(buna.accentObtinut, "#1D3557", `${sablon.nume}: un bleumarin deja lizibil trebuie să rămână cum e`);
    assert.equal(buna.accentAjustat, false);

    const galben = paletaDinCuloare(sablon.paleta, "#FFEB3B");
    assert.equal(galben.accentAjustat, true, `${sablon.nume}: un galben nu poate fi accent lizibil pe crem`);
    assert.ok(oklchDinHex(galben.accentObtinut).l < oklchDinHex("#FFEB3B").l, "galbenul trebuie să iasă mai închis");
    assert.equal(galben.culoareaAleasa, "#FFEB3B", "culoarea aleasă rămâne în rezultat, ca panoul s-o poată arăta");
  }
});

test("„Apropiere” își păstrează al doilea accent, cald, și accentul de titlu rămâne citibil ca titlu mare", () => {
  const apropiere = getTemplate("apropiere").paleta;
  for (const culoare of CULORI) {
    const { paleta } = paletaDinCuloare(apropiere, culoare);
    assert.equal(paleta.accentCald, apropiere.accentCald, "piersica e identitatea șablonului");
    for (const fundal of [paleta.fundal, paleta.fundalNuantat, paleta.fundalRelief]) {
      assert.ok(contrast(paleta.accentCaldInchis, fundal) >= 3.1, `${culoare}: accentul de titlu (${paleta.accentCaldInchis}) pe ${fundal}`);
    }
  }
  // Celelalte șabloane n-au al doilea accent și nu li se inventează.
  const caldura = paletaDinCuloare(getTemplate("caldura").paleta, "#2E7D5B").paleta;
  assert.equal("accentCald" in caldura, false);
  assert.equal("accentCaldInchis" in caldura, false);
});

test("perechiDeContrast (din cod) = lista scrisă independent aici", () => {
  const p = getTemplate("caldura").paleta;
  const dinCod = perechiDeContrast(p).map((x) => [x.text, x.fundal].join("|")).sort();
  const independent = perechiIndependente(p).map(([, text, fundal]) => [text, fundal].join("|")).sort();
  assert.deepEqual(dinCod, independent);
  assert.ok(perechiDeContrast(p).every((x) => x.minim === PRAG_CONTRAST));
  assert.ok(perechiDeContrast(p).every((x) => x.nume.length > 5 && !/^[a-z]+[A-Z]/.test(x.nume)), "numele sunt pe înțelesul clientului, nu nume de roluri");
});

test("determinist: aceeași culoare, același șablon → aceeași paletă", () => {
  const p = getTemplate("liniste").paleta;
  assert.deepEqual(paletaDinCuloare(p, "#C0392B"), paletaDinCuloare(p, "#C0392B"));
});

// ───────────────────────── ce vine din bază ─────────────────────────

test("`getTemplate` fără culori întoarce EXACT șablonul — site-urile existente nu se schimbă", () => {
  for (const sablon of listTemplates()) {
    assert.equal(getTemplate(sablon.id), sablon, "fără al doilea argument: același obiect");
    for (const nimic of [undefined, null, {}, [], "auto", 7, { mod: "auto" }, { mod: "auto", principala: "rosu" }, { mod: "manual" }, { mod: "manual", manual: {} }, { mod: "altceva", principala: "#2E7D5B" }]) {
      assert.equal(getTemplate(sablon.id, nimic), sablon, `${JSON.stringify(nimic)} nu trebuie să schimbe nimic`);
    }
    // Aceleași variabile CSS, octet cu octet.
    assert.deepEqual(templateStyle(getTemplate(sablon.id, null)), templateStyle(sablon));
  }
});

test("cu o culoare validă, se schimbă DOAR paleta; fonturile, formele și așezările rămân ale șablonului", () => {
  const sablon = getTemplate("liniste");
  const efectiv = getTemplate("liniste", { mod: "auto", principala: "#2E7D5B" });
  assert.notEqual(efectiv, sablon);
  assert.notDeepEqual(efectiv.paleta, sablon.paleta);
  assert.equal(efectiv.id, sablon.id);
  assert.equal(efectiv.tipografie, sablon.tipografie);
  assert.equal(efectiv.forme, sablon.forme);
  assert.equal(efectiv.asezari, sablon.asezari);
  assert.equal(templateStyle(efectiv)["--t-accent"], efectiv.paleta.accent, "variabilele CSS vin din paleta efectivă");
});

test("un JSON din bază cu bucăți stricate: ce e valid se păstrează, ce nu se aruncă", () => {
  const citit = citesteAspectCulori({
    mod: "manual",
    principala: "#2e7d5b",
    manual: { text: "#111111", fundal: "nu-e-culoare", inventat: "#222222", accent: 5 },
    asumat: "da",
  });
  assert.deepEqual(citit, { mod: "manual", principala: "#2E7D5B", manual: { text: "#111111" }, asumat: false });
  assert.deepEqual(culoriDinBrand({ aspect: { culori: { mod: "auto" } } }), { mod: "auto" });
  for (const nimic of [null, undefined, 3, "x", [], { aspect: 3 }, { aspect: null }, { aspect: {} }]) {
    assert.equal(culoriDinBrand(nimic), undefined, JSON.stringify(nimic));
  }
});

// ───────────────────────── modul manual ─────────────────────────

test("modul manual: aplică exact ce a ales omul, peste paleta calculată din culoarea principală", () => {
  const sablon = getTemplate("caldura").paleta;
  const aspect = citesteAspectCulori({ mod: "manual", principala: "#2E7D5B", manual: { text: "#FF00FF", fundalInchis: "#102030" } });
  const paleta = paletaEfectiva(sablon, aspect);
  const calculata = paletaDinCuloare(sablon, "#2E7D5B").paleta;

  assert.equal(paleta.text, "#FF00FF");
  assert.equal(paleta.fundalInchis, "#102030");
  // Ce n-a atins rămâne cum a calculat paleta.
  for (const rol of ["fundal", "fundalNuantat", "accent", "accentText", "accentPeInchis", "textSecundar"]) {
    assert.equal(paleta[rol], calculata[rol], rol);
  }
});

test("modul manual fără nicio culoare principală pornește de la paleta șablonului", () => {
  const sablon = getTemplate("lumina").paleta;
  const paleta = paletaEfectiva(sablon, citesteAspectCulori({ mod: "manual", manual: { accent: "#123456" } }));
  assert.equal(paleta.accent, "#123456");
  assert.equal(paleta.fundal, sablon.fundal);
  assert.equal(paleta.text, sablon.text);
});

test("schimbi fundalul în modul manual: fundalul „mai închis” și chenarul se mută cu el", () => {
  const sablon = getTemplate("caldura").paleta;
  const paleta = paletaEfectiva(sablon, citesteAspectCulori({ mod: "manual", manual: { fundal: "#FFF0F0" } }));
  assert.equal(paleta.fundal, "#FFF0F0");
  assert.notEqual(paleta.fundalRelief, sablon.fundalRelief, "relieful trebuie să urmeze fundalul nou");
  assert.equal(paleta.chenar, paleta.fundalRelief);
  // Relieful rămâne mai închis decât fundalul, ca la șablon.
  assert.ok(luminanta(paleta.fundalRelief) < luminanta(paleta.fundal));
  const hRelief = oklchDinHex(paleta.fundalRelief).h;
  const hFundal = oklchDinHex("#FFF0F0").h;
  assert.ok(Math.abs(hRelief - hFundal) < 5, "relieful ia nuanța fundalului nou");
});

test("o combinație greu de citit nu e oprită, doar semnalată — cu numele pe înțelesul omului", () => {
  const sablon = getTemplate("caldura").paleta;
  // Text de aceeași culoare cu fundalul: de necitit, și e alegerea lui.
  const paleta = paletaEfectiva(sablon, citesteAspectCulori({ mod: "manual", manual: { text: sablon.fundal } }));
  assert.equal(paleta.text, sablon.fundal, "alegerea se aplică, fără să fie corectată");

  const slabe = verificaPerechi(paleta).filter((p) => !p.trece);
  assert.ok(slabe.length >= 1);
  assert.ok(slabe.some((p) => p.nume === "Textul pe fundalul paginii"), slabe.map((p) => p.nume).join(" | "));
  assert.ok(slabe.every((p) => p.raport < p.minim));

  // Paleta șablonului, neatinsă, nu are avertismente.
  assert.deepEqual(verificaPerechi(sablon).filter((p) => !p.trece), []);
});

test("cele opt culori ale modului manual: nume pe înțelesul unui client, fără duplicate, toate roluri reale", () => {
  assert.equal(ROLURI_MANUALE.length, 8);
  const chei = ROLURI_MANUALE.map((rol) => rol.cheie);
  assert.equal(new Set(chei).size, chei.length);
  const paleta = getTemplate("caldura").paleta;
  for (const rol of ROLURI_MANUALE) {
    assert.ok(rol.cheie in paleta, `${rol.cheie} nu e un rol din paletă`);
    assert.ok(rol.nume.length > 3 && rol.explicatie.length > 10);
    assert.ok(!/[a-z][A-Z]/.test(rol.nume), `numele „${rol.nume}” arată a nume de variabilă`);
  }
});

// ───────────────────────── legăturile din cod ─────────────────────────

const citeste = (cale) => readFileSync(cale, "utf8");

test("site-ul public și toate previzualizările din panou citesc culorile alese — doar prin poartă", () => {
  assert.ok(citeste("src/components/site/cadru-site.tsx").includes("culoriPermise(brand, { domain, template: site?.template })"));
  for (const cale of [
    "src/app/dashboard/sectiuni/[id]/page.tsx",
    "src/app/dashboard/servicii/[id]/page.tsx",
    "src/app/dashboard/setari/page.tsx",
  ]) {
    assert.match(citeste(cale), /culoriPermise\(\s*(setari\?\.brand|brand), \{ domain: site\?\.domain as string \| null, template: /, cale);
  }
  for (const cale of ["src/app/dashboard/pagini/[id]/page.tsx", "src/app/dashboard/blog/[id]/page.tsx"]) {
    const text = citeste(cale);
    assert.ok(text.includes("brandulSiteului(supabase, session.siteId)"), cale);
    assert.match(text, /culoriPermise\(brand, \{ domain: site\?\.domain as string \| null, template: /, cale);
  }
});

test("nicio culoare din `brand` nu ajunge pe un site pe lângă poartă: `culoriDinBrand` se cheamă doar din biblioteca „aspect”, plus ecranul Aspect", () => {
    const gasite = execFileSync("grep", ["-rln", "culoriDinBrand", "src"], { encoding: "utf8" })
    .split("\n").filter(Boolean).sort();
  assert.deepEqual(gasite, [
    "src/app/dashboard/aspect/page.tsx", // ecranul însuși: are poarta lui (`notFound`)
    "src/lib/aspect/acces.ts",
    "src/lib/aspect/culori.ts",
  ]);
});

test("salvarea Setărilor PĂSTREAZĂ aspectul ales — altfel fiecare salvare ar șterge culorile", () => {
  const actiune = citeste("src/app/dashboard/setari/actions.ts");
  assert.ok(actiune.includes("existente?.brand"), "trebuie citit brand-ul de până acum");
  assert.ok(actiune.includes("{ ...brand, aspect }"), "aspectul trebuie pus la loc în brand");
  assert.ok(actiune.includes("brand: brandDeScris"), "upsert-ul trebuie să scrie brand-ul cu aspect, nu cel din formular");
  assert.ok(!/brand,\s*seo: seoCurat/.test(actiune), "a rămas upsert-ul vechi, care șterge aspectul");
});

// ───────────────────────── salvarea din meniul „Aspect” ─────────────────────────

test("culorile gata alese nu sunt întunecate vizibil pe niciun șablon (cel mult o treaptă imperceptibilă)", () => {
  assert.ok(PRESETURI_CULOARE.length >= 8);
  assert.equal(new Set(PRESETURI_CULOARE.map((p) => p.hex)).size, PRESETURI_CULOARE.length, "fără duplicate");
  for (const preset of PRESETURI_CULOARE) {
    assert.ok(esteHexValid(preset.hex) && preset.hex === normalizeazaHex(preset.hex), preset.nume);
    for (const sablon of listTemplates()) {
      const rezultat = paletaDinCuloare(sablon.paleta, preset.hex);
      assert.equal(rezultat.accentAjustat, false, `${preset.nume} (${preset.hex}) ajunge întunecată pe „${sablon.nume}”: ${rezultat.accentObtinut}`);
      // Aceeași nuanță, aproape aceeași luminozitate: diferența, dacă există, nu se vede.
      const dorit = oklchDinHex(preset.hex);
      const obtinut = oklchDinHex(rezultat.accentObtinut);
      assert.ok(Math.abs(dorit.l - obtinut.l) < 0.015, `${preset.nume} pe „${sablon.nume}”: L ${dorit.l.toFixed(3)} → ${obtinut.l.toFixed(3)}`);
    }
  }
});

test("salvare automat: o culoare validă trece, normalizată; fără culoare sau cu o culoare stricată, nu", () => {
  assert.deepEqual(valideazaCulori({ mod: "auto", principala: " #2e7d5b ", manual: { text: "#111111" }, asumat: true }), {
    ok: true,
    culori: { mod: "auto", principala: "#2E7D5B", manual: {}, asumat: false },
  });
  for (const rau of [{ mod: "auto" }, { mod: "auto", principala: "" }, { mod: "auto", principala: null }]) {
    const r = valideazaCulori(rau);
    assert.equal(r.ok, false, JSON.stringify(rau));
    assert.match(r.mesaj, /Alege o culoare/);
  }
  for (const rau of ["rosu", "#12", "url(javascript:alert(1))", "#2E7D5B; background:red", 7, {}]) {
    const r = valideazaCulori({ mod: "auto", principala: rau });
    assert.equal(r.ok, false, String(rau));
    assert.match(r.mesaj, /Culoarea principală nu e o culoare validă/);
  }
});

test("salvare manual: cele opt culori trec, orice altă cheie se aruncă, o culoare stricată se SPUNE cu numele ei", () => {
  const r = valideazaCulori({
    mod: "manual",
    principala: "#2E7D5B",
    manual: { text: "#111111", accent: "#abcdef", inventat: "#222222", __proto__: { x: 1 } },
    asumat: true,
  });
  assert.deepEqual(r, {
    ok: true,
    culori: { mod: "manual", principala: "#2E7D5B", manual: { text: "#111111", accent: "#ABCDEF" }, asumat: true },
  });
  assert.equal("inventat" in r.culori.manual, false);

  const rau = valideazaCulori({ mod: "manual", manual: { textSecundar: "gri" } });
  assert.equal(rau.ok, false);
  assert.match(rau.mesaj, /„Textul discret” nu e o culoare validă/);

  const nimic = valideazaCulori({ mod: "manual", principala: null, manual: {} });
  assert.equal(nimic.ok, false);
  assert.match(nimic.mesaj, /Nu ai schimbat nicio culoare/);

  // Manual doar cu punctul de pornire e permis: omul a ales o bază și n-a mai atins nimic.
  assert.equal(valideazaCulori({ mod: "manual", principala: "#2E7D5B" }).ok, true);
  // „asumat” se ia doar dacă e exact `true`.
  assert.equal(valideazaCulori({ mod: "manual", principala: "#2E7D5B", asumat: "da" }).culori.asumat, false);
});

test("ce nu e un obiect cu mod valid nu se acceptă", () => {
  for (const rau of [null, undefined, 3, "auto", [], { mod: "altceva", principala: "#2E7D5B" }, {}]) {
    const r = valideazaCulori(rau);
    assert.equal(r.ok, false, JSON.stringify(rau));
    assert.match(r.mesaj, /Reîncarcă pagina/);
  }
});

test("culorile se pun în `brand` fără să atingă nimic altceva — nici datele din Setări, nici fonturile de mai târziu", () => {
  const culori = { mod: "auto", principala: "#2E7D5B", manual: {}, asumat: false };
  const brand = { telefon: "0722", copyright: "Cabinet", aspect: { fonturi: { text: "x" } } };

  const cu = brandCuCulori(brand, culori);
  assert.deepEqual(cu, { telefon: "0722", copyright: "Cabinet", aspect: { fonturi: { text: "x" }, culori } });
  assert.deepEqual(brand.aspect, { fonturi: { text: "x" } }, "brand-ul primit nu se modifică pe loc");

  // Scoase: dispare doar `culori`.
  assert.deepEqual(brandCuCulori(cu, null), brand);
  // Fără fonturi, `aspect` gol dispare cu totul — nu rămâne `aspect: {}` în bază.
  assert.deepEqual(brandCuCulori({ telefon: "0722", aspect: { culori } }, null), { telefon: "0722" });
  // Un site fără `brand` ori cu `brand` stricat primește un obiect curat.
  for (const gol of [null, undefined, 5, "x", []]) {
    assert.deepEqual(brandCuCulori(gol, culori), { aspect: { culori } }, JSON.stringify(gol));
    assert.deepEqual(brandCuCulori(gol, null), {}, JSON.stringify(gol));
  }
  // Ce a salvat acțiunea se citește înapoi la fel.
  assert.deepEqual(citesteAspectCulori(culoriDinBrand(cu)), culori);
});

test("acțiunea de salvare: verifică sesiunea întâi, validează, păstrează `brand`, scrie în jurnal și reîmprospătează tot site-ul", () => {
  const actiune = citeste("src/app/dashboard/aspect/actions.ts");
  assert.ok(actiune.startsWith('"use server";'));
  const [iSesiune, iPoarta, iValidare, iScriere] = ["await verifySession()", "aspectPermis({ domain: site?.domain, template: site?.template })", "valideazaCulori(brut)", ".upsert("].map((x) => actiune.indexOf(x));
  assert.ok(iSesiune >= 0, "lipsește verificarea sesiunii");
  assert.ok(iPoarta > iSesiune, "poarta se verifică după sesiune și înaintea oricărei validări sau scrieri");
  assert.ok(iValidare > iPoarta, "un site fără poartă nu ajunge nici la validare");
  assert.ok(actiune.includes('.from("sites").select("domain, template")'), "domeniul și șablonul se citesc din bază, nu din cerere");
  assert.ok(iScriere > iValidare, "se validează înainte să se scrie");
  assert.ok(actiune.includes("const verificat = valideazaCulori(brut);"), "ce trimite browserul trece prin validare, nu se crede");
  assert.ok(actiune.includes("if (!verificat.ok) return { ok: false, mesaj: verificat.mesaj };"), "o validare eșuată oprește salvarea");
  assert.ok(actiune.includes("culori = verificat.culori;"), "se scrie ce a ieșit din validare, nu ce a trimis browserul");
  assert.ok(actiune.includes("brandCuCulori(existente?.brand, culori)"), "brand-ul de acum trebuie citit și păstrat");
  assert.ok(/\.upsert\(\s*\{ site_id: session\.siteId, brand: /.test(actiune), "se scrie DOAR brand: seo și social nu se ating");
  assert.ok(!/seo:|social:/.test(actiune.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")), "acțiunea nu are ce căuta în seo/social");
  assert.ok(actiune.includes('entitate: "SiteSettings"'));
  assert.ok(actiune.includes('revalidatePath("/", "layout")'), "culorile se văd pe toate paginile publice");
});

test("ecranul „Aspect” e în meniu, înaintea Setărilor, și are o pagină", () => {
  const meniu = citeste("src/components/sidebar-nav.tsx");
  assert.ok(meniu.includes('{ label: "Aspect", href: "/dashboard/aspect" }'));
  assert.ok(meniu.indexOf('label: "Aspect"') < meniu.indexOf('label: "Setări"'));
  // În probă: intrarea apare doar când poarta e deschisă, iar implicit e închisă.
  assert.ok(meniu.includes("aspectActiv = false"), "implicit, intrarea nu apare");
  assert.ok(meniu.includes('NAV.filter((item) => aspectActiv || item.label !== "Aspect")'));
  const aranjament = citeste("src/app/dashboard/layout.tsx");
  assert.ok(aranjament.includes("aspectActiv={aspectPermis({ domain: site?.domain, template: site?.template })}"));
  assert.ok(aranjament.includes('select("name, domain, template")'), "layout-ul trebuie să citească și șablonul");
  const pagina = citeste("src/app/dashboard/aspect/page.tsx");
  assert.ok(pagina.includes("verifySession()"));
  assert.ok(pagina.includes("citesteAspectCulori(culoriDinBrand(setari?.brand))"));
  assert.ok(pagina.includes("if (!aspectPermis({ domain: site?.domain as string | null, template: site?.template as string | null })) notFound();"), "fără poartă, pagina e 404");
  assert.ok(pagina.indexOf("notFound();") < pagina.indexOf("<FormularAspect"));
});

test("modul manual are un loc vizibil pe ecran, cu explicație (cerut de proprietar), și salvarea nu e blocată de avertismente", () => {
  const ecran = citeste("src/app/dashboard/aspect/formular.tsx");
  assert.ok(ecran.includes('titlu="Manual"'), "modul manual nu e ascuns");
  assert.ok(/nu mai verificăm noi\s+dacă se citește bine/.test(ecran), "explicația spune ce înseamnă „manual”");
  assert.ok(ecran.includes("Poți salva oricum"), "avertismentele nu opresc salvarea");
  assert.ok(!/disabled=\{[^}]*slabe/.test(ecran), "butonul de salvare nu depinde de avertismente");
});

test("previzualizarea din „Aspect” arată toate cele patru fundaluri — inclusiv cel închis, la ORICE șablon", () => {
  const ecran = citeste("src/app/dashboard/aspect/formular.tsx");
  const randuri = ecran.slice(ecran.indexOf("const RANDURI_EXEMPLU"), ecran.indexOf("const LINKURI_EXEMPLU"));
  for (const ton of ["deschis", "nuantat", "relief", "inchis"]) {
    assert.ok(randuri.includes(`tone: "${ton}"`), `lipsește tonul „${ton}” din exemple`);
  }
  // La „Căldură" citatul stă mereu pe relief: dacă fundalul închis ar sta pe el, n-ar apărea acolo.
  assert.match(randuri, /key: "quote",\s+variant: null,\s+tone: "relief"/);
  assert.ok(!/key: "quote",\s+variant: null,\s+tone: "inchis"/.test(randuri), "fundalul închis nu poate sta pe citat");
});

// ───────────────────────── poarta „în probă” ─────────────────────────

// Proprietarul a cerut „Aspect" pe „model claritate" (site-ul lui), NU pe sitepsihologi (18 oct.).
const DOMENIU_PERMIS = "model-claritate.vercel.app";
// Un domeniu de probă și listele cu care se încearcă REGULA (listele reale se verifică separat).
const DOMENIU_PROBA = "cabinet-proba.test";
const LISTE_PROBA = { sabloane: ["claritate"], domenii: [DOMENIU_PROBA] };

test("listele reale: Claritate + model-claritate, și NICIODATĂ sitepsihologi", () => {
  assert.deepEqual([...SABLOANE_CU_ASPECT], ["claritate"]);
  assert.deepEqual([...DOMENII_CU_ASPECT], [DOMENIU_PERMIS]);
  for (const domeniu of DOMENII_CU_ASPECT) {
    assert.ok(!/sitepsihologi/i.test(domeniu), "proprietarul a cerut „Aspect” NU pe sitepsihologi");
    assert.equal(domeniu, domeniu.toLowerCase().trim(), "domeniile se scriu cu litere mici, fără spații");
    assert.ok(!/^https?:|\/|\s/.test(domeniu), "doar domeniul, fără https:// sau cale");
  }
  // Cu listele reale: „model claritate" pe Claritate are poarta deschisă, orice altceva nu.
  assert.equal(aspectPermis({ domain: DOMENIU_PERMIS, template: "claritate" }), true);
  assert.equal(aspectPermis({ domain: DOMENIU_PERMIS, template: "caldura" }), false);
  for (const altul of ["sitepsihologi.vercel.app", "sitepsihologi.ro", "model-liniste.vercel.app", "model-caldura.vercel.app", "cosmin-claritate.vercel.app"]) {
    assert.equal(aspectPermis({ domain: altul, template: "claritate" }), false, altul);
  }
  assert.equal(culoriPermise({ aspect: { culori: { mod: "auto", principala: "#2E7D5B" } } }, { domain: "sitepsihologi.vercel.app", template: "claritate" }), undefined);
});

test("poarta: ȘI șablonul, ȘI domeniul — ambele deodată (regula, cu liste de probă)", () => {
  const permis = (site) => aspectPermis(site, LISTE_PROBA);
  assert.equal(permis({ domain: DOMENIU_PROBA, template: "claritate" }), true);
  // Un site Claritate al altcuiva nu primește nimic.
  assert.equal(permis({ domain: "alt-cabinet.test", template: "claritate" }), false);
  // Nici site-ul permis, dacă ar trece pe alt șablon.
  for (const sablon of ["caldura", "liniste", "lumina", "apropiere", "altceva", "", null, undefined]) {
    assert.equal(permis({ domain: DOMENIU_PROBA, template: sablon }), false, String(sablon));
  }
  for (const gol of [null, undefined, ""]) assert.equal(permis({ domain: gol, template: "claritate" }), false);
  // Potrivire EXACTĂ: nu „conține", nu prefix/sufix, nu litere mari, nu subdomeniu al celui permis.
  for (const aproape of [`www.${DOMENIU_PROBA}`, `${DOMENIU_PROBA}.evil.com`, `x${DOMENIU_PROBA}`, DOMENIU_PROBA.toUpperCase(), ` ${DOMENIU_PROBA}`, "cabinet-proba"]) {
    assert.equal(permis({ domain: aproape, template: "claritate" }), false, aproape);
  }
  assert.equal(permis({ domain: DOMENIU_PROBA, template: "Claritate" }), false);
  assert.equal(permis({ domain: DOMENIU_PROBA, template: "claritate " }), false);
  // Liste goale: nimeni.
  assert.equal(aspectPermis({ domain: DOMENIU_PROBA, template: "claritate" }, { sabloane: [], domenii: [DOMENIU_PROBA] }), false);
  assert.equal(aspectPermis({ domain: DOMENIU_PROBA, template: "claritate" }, { sabloane: ["claritate"], domenii: [] }), false);
});

test("poarta închisă: culorile salvate în bază NU ajung pe site — șablonul rămâne neatins", () => {
  const brand = { aspect: { culori: { mod: "auto", principala: "#2E7D5B", manual: {}, asumat: false } } };

  for (const [nume, site] of [
    ["alt site, Claritate", { domain: "alt-cabinet.test", template: "claritate" }],
    ["site-ul permis, alt șablon", { domain: DOMENIU_PROBA, template: "caldura" }],
    ["fără site", { domain: null, template: null }],
  ]) {
    assert.equal(culoriPermise(brand, site, LISTE_PROBA), undefined, nume);
    for (const sablon of listTemplates()) {
      assert.equal(getTemplate(sablon.id, culoriPermise(brand, site, LISTE_PROBA)), sablon, `${nume}: ${sablon.id} trebuie să rămână același obiect`);
    }
  }

  // Poarta deschisă: culorile trec, iar șablonul Claritate se colorează.
  const permis = culoriPermise(brand, { domain: DOMENIU_PROBA, template: "claritate" }, LISTE_PROBA);
  assert.deepEqual(citesteAspectCulori(permis)?.principala, "#2E7D5B");
  assert.notEqual(getTemplate("claritate", permis), getTemplate("claritate"));
  assert.notDeepEqual(getTemplate("claritate", permis).paleta, getTemplate("claritate").paleta);
});
