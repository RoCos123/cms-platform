import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTemplate, listTemplates, templateStyle } from "@/lib/templates";
import {
  contrast,
  esteHexValid,
  hexDinHsl,
  hexDinOklch,
  hslDinHex,
  luminanta,
  normalizeazaHex,
  oklchDinHex,
} from "@/lib/aspect/culoare";
import { PRAG_CONTRAST, bazaManuala, paletaDinCuloare, perechiDeContrast, verificaPerechi } from "@/lib/aspect/paleta";
import {
  ROLURI_MANUALE,
  citesteAspectCulori,
  culoriDinBrand,
  paletaEfectiva,
} from "@/lib/aspect/culori";
import { CULOARE_PROPUSA, PRESETURI_CULOARE, brandCuCulori, valideazaCulori } from "@/lib/aspect/salvare";
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

/**
 * Lumina mătăsii (a treia rundă premium, 19 oct.), scrisă din nou aici, cu numerele proprietarului:
 * aceeași nuanță, L + 0,07, C + 0,02 (un gri nu capătă cromă).
 */
function luminaMatase(hex) {
  const o = oklchDinHex(hex);
  return hexDinOklch({ l: Math.min(1, o.l + 0.07), c: o.c < 0.01 ? o.c : o.c + 0.02, h: o.h });
}
function umbraMatase(hex) {
  const o = oklchDinHex(hex);
  return hexDinOklch({ l: Math.max(0, o.l - 0.05), c: o.c, h: o.h });
}

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
  // Mătasea: ce stă pe bandă, și textul butonului, se citesc și pe partea LUMINOASĂ a gradientului.
  if (p.fundalInchisMatase) {
    for (const rol of ["textPeInchis", "textSecundarPeInchis", "accentPeInchis", "eroarePeInchis"]) {
      lista.push([`${rol} pe lumina benzii`, p[rol], luminaMatase(p.fundalInchis)]);
    }
  }
  if (p.accentMatase) lista.push(["accentText pe lumina butonului", p.accentText, luminaMatase(p.accent)]);
  // Paleta premium (19 oct.): linkurile pe fundalurile deschise și textul butonului la hover.
  if (p.accentInteractiv) {
    for (const [numeFundal, fundal] of [["fundal", p.fundal], ["fundalNuantat", p.fundalNuantat], ["fundalRelief", p.fundalRelief]]) {
      lista.push([`accentInteractiv pe ${numeFundal}`, p.accentInteractiv, fundal]);
    }
    lista.push(["accentText pe accentInteractiv (hover)", p.accentText, p.accentInteractiv]);
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

      // Fundalurile deschise sunt, din a treia rundă (19 oct.), calcarul cald al proprietarului,
      // același la orice șablon — vezi testul regulilor, mai jos.

      // Roșul erorilor rămâne roșu: o eroare verde ar fi o minciună.
      const h = oklchDinHex(paleta.eroare).h;
      assert.ok(h < 50 || h > 350, `${culoare}: eroarea nu mai e roșie (h=${h.toFixed(0)})`);

      // Toate rolurile sunt culori valide; cele „Matase" sunt gradiente cu trei culori valide.
      for (const [rol, valoare] of Object.entries(paleta)) {
        if (rol.endsWith("Matase")) {
          assert.match(valoare, /^linear-gradient\(135deg, #[0-9A-F]{6} 20%, #[0-9A-F]{6} 50%, #[0-9A-F]{6} 90%\)$/, `${culoare}: ${rol}`);
        } else {
          assert.ok(esteHexValid(valoare), `${culoare}: ${rol} = ${valoare}`);
        }
      }
    }
  });
}

test("„Silk & Velvet”: calcar cald pe deschis, același la orice culoare; banda bogată, cu subtonul culorii", () => {
  // A treia rundă (19 oct.): a doua, cu banda la cromă 0,025, ieșise „plată, ștearsă".
  for (const culoare of ["#083D27", "#0A3D44", "#4F0D1A", "#1F1646", "#FFEB3B", "#808080"]) {
    const { paleta } = paletaDinCuloare(getTemplate("claritate").paleta, culoare);
    assert.equal(paleta.fundal, "#F2EFE9", "pagina: calcar deschis");
    assert.equal(paleta.fundalNuantat, "#FAF8F5", "cardurile: fildeș mătăsos");
    assert.equal(paleta.fundalRelief, "#E8E2D5", "relieful: calcar mai pronunțat");
    assert.equal(paleta.chenar, "#E2DDD3", "chenarul: cald");
    assert.equal(paleta.textPeInchis, "#FAF6F0");
    assert.equal(paleta.textSecundarPeInchis, "#D6CFC4");
    assert.equal(paleta.accentPeInchis, "#DFC59B", "cifrele și accentele de pe bandă: aur-șampanie");
    for (const rol of ["text", "textSecundar"]) assert.ok(oklchDinHex(paleta[rol]).c <= 0.009, `${culoare}: ${rol} colorat`);
  }
  // Banda NU mai e stinsă: la culorile cromatice păstrează croma (≥ 0,065, cât permite ecranul).
  for (const [hex, minim] of [["#4F0D1A", 0.065], ["#1F1646", 0.065], ["#0A3463", 0.065], ["#3A0A26", 0.065]]) {
    const c = oklchDinHex(paletaDinCuloare(getTemplate("claritate").paleta, hex).paleta.fundalInchis).c;
    assert.ok(c >= minim - 0.003, `${hex}: banda are cromă ${c.toFixed(3)}`);
  }
  // O culoare temperată rămâne temperată (Eucalipt: verde mineral, nu neon).
  const eucalipt = oklchDinHex(paletaDinCuloare(getTemplate("claritate").paleta, "#3A4637").paleta.fundalInchis);
  assert.ok(eucalipt.c < 0.03, `Eucalipt: banda are cromă ${eucalipt.c.toFixed(3)}`);
});

test("„Claritate”: fără culori alese își păstrează albul pur; cu o culoare aleasă, cardurile capătă tenta fină (hotărârea proprietarului)", () => {
  const claritate = getTemplate("claritate").paleta;
  assert.equal(claritate.fundalNuantat, "#FFFFFF", "șablonul neatins rămâne exact cum era");
  for (const culoare of ["#0D3B66", "#2E7D5B", "#E91E63"]) {
    const nuantat = paletaDinCuloare(claritate, culoare).paleta.fundalNuantat;
    assert.notEqual(nuantat, "#FFFFFF", culoare);
    const l = hslDinHex(nuantat).l;
    assert.ok(l >= 94.5 && l <= 97.5, `${culoare}: L ${l.toFixed(1)}`);
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

test("cele nouă culori ale modului manual: nume pe înțelesul unui client, fără duplicate, toate roluri reale", () => {
  assert.equal(ROLURI_MANUALE.length, 9);
  const chei = ROLURI_MANUALE.map((rol) => rol.cheie);
  assert.equal(new Set(chei).size, chei.length);
  // A noua (19 oct.): linkurile, cu nume pe înțelesul omului.
  const linkuri = ROLURI_MANUALE.find((rol) => rol.cheie === "accentInteractiv");
  assert.equal(linkuri?.nume, "Linkurile");
  const paleta = paletaDinCuloare(getTemplate("caldura").paleta, "#0D3B66").paleta;
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

// Proprietarul a cerut „Aspect" pe „model claritate" (site-ul lui), NU pe sitepsihologi (18 oct.);
// apoi, câte un șablon pe rând, Lumină pe „model-lumina" (20 oct.).
const DOMENIU_PERMIS = "model-claritate.vercel.app";
const DOMENIU_LUMINA = "model-lumina.vercel.app";
// Un domeniu de probă și listele cu care se încearcă REGULA (listele reale se verifică separat).
const DOMENIU_PROBA = "cabinet-proba.test";
const LISTE_PROBA = { sabloane: ["claritate"], domenii: [DOMENIU_PROBA] };

test("listele reale: Claritate + model-claritate, Lumină + model-lumina, și NICIODATĂ sitepsihologi", () => {
  assert.deepEqual([...SABLOANE_CU_ASPECT], ["claritate", "lumina"]);
  assert.deepEqual([...DOMENII_CU_ASPECT], [DOMENIU_PERMIS, DOMENIU_LUMINA]);
  for (const domeniu of DOMENII_CU_ASPECT) {
    assert.ok(!/sitepsihologi/i.test(domeniu), "proprietarul a cerut „Aspect” NU pe sitepsihologi");
    assert.equal(domeniu, domeniu.toLowerCase().trim(), "domeniile se scriu cu litere mici, fără spații");
    assert.ok(!/^https?:|\/|\s/.test(domeniu), "doar domeniul, fără https:// sau cale");
  }
  // Cu listele reale: „model claritate" pe Claritate are poarta deschisă, orice altceva nu.
  assert.equal(aspectPermis({ domain: DOMENIU_PERMIS, template: "claritate" }), true);
  assert.equal(aspectPermis({ domain: DOMENIU_PERMIS, template: "caldura" }), false);
  assert.equal(aspectPermis({ domain: DOMENIU_LUMINA, template: "lumina" }), true);
  assert.equal(aspectPermis({ domain: DOMENIU_LUMINA, template: "liniste" }), false);
  for (const altul of ["sitepsihologi.vercel.app", "sitepsihologi.ro", "model-liniste.vercel.app", "model-caldura.vercel.app", "cosmin-claritate.vercel.app", "alt-cabinet.vercel.app"]) {
    for (const sablon of ["claritate", "lumina"]) assert.equal(aspectPermis({ domain: altul, template: sablon }), false, `${altul} (${sablon})`);
  }
  // Șabloanele încă nedeschise rămân închise, oricare ar fi domeniul.
  for (const sablon of ["caldura", "liniste", "apropiere"]) {
    for (const domeniu of DOMENII_CU_ASPECT) assert.equal(aspectPermis({ domain: domeniu, template: sablon }), false, `${sablon} pe ${domeniu}`);
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

// ───────────────────────── previzualizarea cu site-ul REAL ─────────────────────────

test("previzualizarea din „Aspect” arată site-ul REAL al clientului, cu aceleași funcții ca pe site", () => {
  const prev = citeste("src/lib/aspect/previzualizare.ts");
  assert.ok(prev.startsWith('import "server-only";'), "citește din bază: doar pe server");

  // Aceleași citiri ca prima pagină publică și ca cadrul public.
  for (const functie of [
    "identitateaSiteului(siteId)",
    "articolePublicate(siteId)",
    "serviciiPublicate(siteId)",
    "linkurilePaginilor(siteId)",
    "cheileSectiunilorVizibile(siteId)",
    "dateleSectiuniiPachete(siteId)",
    "tipulSiteului(siteId)",
    "coloaneleSubsolului(siteId",
    "oreDeAratatPePrimaPagina(siteId",
  ]) {
    assert.ok(prev.includes(functie), `lipsește ${functie}`);
  }

  // Secțiunile: doar cele VIZIBILE, în ordinea lor, ale ACESTUI site.
  assert.match(prev, /\.from\("site_content"\)[\s\S]*?\.eq\("site_id", siteId\)[\s\S]*?\.eq\("visible", true\)[\s\S]*?\.order\("position", \{ ascending: true \}\)/);
  // Pozele pe adresa de acum (nu cea veche din JSON) — aceeași rescriere ca pe site.
  assert.ok(prev.includes("rescrieAdreseleFisiere(rescrieAdresele(rand.data, adresaImaginii), adresaFisierului)"));
  // Fără nicio secțiune vizibilă → `null`, ca ecranul să păstreze exemplul în loc de o pagină goală.
  assert.ok(prev.includes("if (!rows || rows.length === 0) return null;"));
  // Blogul oprit stinge secțiunea, ca pe site.
  assert.ok(prev.includes("articole: areBlog ? articole : []"));
});

test("ecranul „Aspect” ia `siteId` din sesiune pentru previzualizare și cade pe exemplu doar când nu are nimic real", () => {
  const pagina = citeste("src/app/dashboard/aspect/page.tsx");
  assert.ok(/previzualizareaSiteului\(\s*supabase,\s*session\.siteId,/.test(pagina), "site-ul vine din sesiune");
  assert.ok(pagina.includes("previzualizare={previzualizare}"));

  const ecran = citeste("src/app/dashboard/aspect/formular.tsx");
  assert.ok(ecran.includes("previzualizare?.header ??"));
  assert.ok(ecran.includes("previzualizare?.footer ??"));
  assert.ok(ecran.includes("previzualizare?.randuri ?? RANDURI_EXEMPLU"));
  assert.ok(ecran.includes("previzualizare?.context ??"));
  // Cu site real, nu se mai arată textele inventate: exemplele apar doar ca rezervă.
  const marcaj = ecran.slice(ecran.indexOf("<PanouPrevizualizare"), ecran.indexOf("</PanouPrevizualizare>"));
  assert.ok(!marcaj.includes("RANDURI_EXEMPLU") && !marcaj.includes("SERVICII_EXEMPLU") && !marcaj.includes("LINKURI_EXEMPLU"), "JSX-ul previzualizării nu are voie să pună exemplele direct");
  assert.ok(marcaj.includes("context={{ ...context, asezari: efectiv.asezari }}"), "așezările vin din șablonul cu culorile alese");
  assert.ok(marcaj.includes("Ce vezi e site-ul tău"), "nota spune clar că e site-ul lui");
  assert.ok(marcaj.includes("nicio secțiune vizibilă"), "iar la exemplu, nota o spune");
});

// ───────────────────────── paleta „premium” (19 oct. 2026) ─────────────────────────
//
// Regulile proprietarului scrise AICI din nou, cu numerele lui, nu importate din cod: dacă
// cineva schimbă o limită în `paleta.ts`, proba asta trebuie să pice.

const intre = (v, jos, sus) => Math.min(sus, Math.max(jos, v));
const gri = (hsl) => hsl.s < 5;

for (const sablon of listTemplates()) {
  test(`„${sablon.nume}”: regulile premium pe ${CULORI.length} de culori — iar unde nu se citește, contrastul câștigă`, () => {
    const gresite = [];
    for (const culoare of CULORI) {
      const hsl = hslDinHex(culoare);
      const { paleta: p } = paletaDinCuloare(sablon.paleta, culoare);
      const asteptat = (nume, valoare) => { if (p[nume] !== valoare) gresite.push(`${culoare} ${nume}: ${p[nume]} în loc de ${valoare}`); };

      // A treia rundă (19 oct.), „Silk & Velvet". Banda: L 0,235, 82% din cromă; o culoare
      // cromatică (C ≥ 0,05) păstrează cel puțin min(0,065, croma ei).
      const o = oklchDinHex(culoare);
      const cromaBanda = o.c < 0.05 ? o.c * 0.82 : Math.max(o.c * 0.82, Math.min(0.065, o.c));
      asteptat("fundalInchis", hexDinOklch({ l: 0.235, c: cromaBanda, h: o.h }));
      // Mătasea benzii și a butonului: lumina 20%, baza 50%, umbra 90%, la 135°.
      asteptat("fundalInchisMatase", `linear-gradient(135deg, ${luminaMatase(p.fundalInchis)} 20%, ${p.fundalInchis} 50%, ${umbraMatase(p.fundalInchis)} 90%)`);
      asteptat("accentMatase", `linear-gradient(135deg, ${luminaMatase(p.accent)} 20%, ${p.accent} 50%, ${umbraMatase(p.accent)} 90%)`);
      // Calcarul cald, exact valorile proprietarului.
      asteptat("fundal", "#F2EFE9");
      asteptat("fundalNuantat", "#FAF8F5");
      asteptat("fundalRelief", "#E8E2D5");
      asteptat("chenar", "#E2DDD3");
      // Pe bandă: fildeș, mătase crudă, aur-șampanie (garda nu mai are ce face: banda e închisă).
      asteptat("textPeInchis", "#FAF6F0");
      asteptat("textSecundarPeInchis", "#D6CFC4");
      asteptat("accentPeInchis", "#DFC59B");
      // Textul alb al butonului se citește și pe lumina mătăsii lui.
      if (contrast(p.accentText, luminaMatase(p.accent)) < 4.5) gresite.push(`${culoare} textul butonului pe lumina mătăsii`);
      // Textele pe deschis: cromă infimă, caldă (C ≤ 0,008, cu toleranța rotunjirii la 8 biți).
      for (const rol of ["text", "textSecundar"]) {
        if (oklchDinHex(p[rol]).c > 0.009) gresite.push(`${culoare} ${rol}: cromă ${oklchDinHex(p[rol]).c.toFixed(3)}`);
      }

      const deschise = [p.fundal, p.fundalNuantat, p.fundalRelief];
      const trece = (hex, fundaluri) => fundaluri.every((f) => contrast(hex, f) >= 4.6);

      // Linkurile: H, S + 12 (cel mult 85), L între 32 și 38. Dacă ținta se citește, EXACT ea;
      // altfel mai închisă, cât să treacă (contrastul câștigă), cu aceeași nuanță.
      const tintaLink = hexDinHsl({ h: hsl.h, s: gri(hsl) ? hsl.s : Math.min(hsl.s + 12, 85), l: intre(hsl.l, 32, 38) });
      if (trece(tintaLink, [...deschise, p.accentText])) {
        asteptat("accentInteractiv", tintaLink);
      } else {
        if (!(oklchDinHex(p.accentInteractiv).l < oklchDinHex(tintaLink).l)) gresite.push(`${culoare} linkuri: nu s-au întunecat`);
        const ht = oklchDinHex(tintaLink);
        const hl = oklchDinHex(p.accentInteractiv);
        const dif = Math.abs(((ht.h - hl.h + 540) % 360) - 180);
        if (ht.c > 0.04 && dif > 8) gresite.push(`${culoare} linkuri: nuanța a fugit (${ht.h.toFixed(0)} → ${hl.h.toFixed(0)})`);
      }

      // Butonul: o culoare foarte deschisă (L > 50) coboară la L ≤ 28; iar textul de pe buton
      // se citește MEREU (se verifică direct, nu doar prin pragul L > 50).
      if (hsl.l > 50 && hslDinHex(p.accent).l > 28.6) gresite.push(`${culoare} buton: L ${hslDinHex(p.accent).l.toFixed(1)} > 28`);
      if (contrast(p.accentText, p.accent) < 4.5) gresite.push(`${culoare} textul butonului: ${contrast(p.accentText, p.accent).toFixed(2)}`);
      // O culoare închisă care se citește oricum rămâne EXACT cea aleasă.
      // (Din a treia rundă, „se citește” înseamnă și textul alb pe LUMINA mătăsii butonului.)
      const seCiteste = trece(culoare, [...deschise, "#FFFFFF"]) && contrast("#FFFFFF", luminaMatase(culoare)) >= 4.6;
      if (hsl.l <= 50 && seCiteste && p.accent !== culoare) gresite.push(`${culoare} buton schimbat degeaba: ${p.accent}`);
    }
    assert.deepEqual(gresite.slice(0, 10), [], `${gresite.length} abateri:\n  ${gresite.slice(0, 10).join("\n  ")}`);
  });
}

test("Petrol și Smarald: linkurile pe 32–38% nu s-ar citi — se întunecă exact cât trebuie (contrastul câștigă)", () => {
  for (const sablon of listTemplates()) {
    for (const hex of ["#0B4249", "#0E3A2F"]) {
      const { paleta: p } = paletaDinCuloare(sablon.paleta, hex);
      const hsl = hslDinHex(hex);
      const tinta = hexDinHsl({ h: hsl.h, s: Math.min(hsl.s + 12, 85), l: intre(hsl.l, 32, 38) });
      assert.ok(contrast(tinta, p.fundalNuantat) < 4.5, `${hex}: ținta trecea oricum — proba n-ar mai dovedi nimic`);
      for (const f of [p.fundal, p.fundalNuantat, p.fundalRelief]) assert.ok(contrast(p.accentInteractiv, f) >= 4.5, `${sablon.nume} ${hex}`);
      // Și doar cât trebuie: nu mult sub prag (cel mult ~1 punct peste).
      assert.ok(Math.min(...[p.fundal, p.fundalNuantat, p.fundalRelief].map((f) => contrast(p.accentInteractiv, f))) < 5.6);
    }
  }
});

test("cele 12 culori „Silk & Velvet”: exact numele și codurile proprietarului, în ordinea lui; Safir e cea propusă", () => {
  assert.deepEqual(
    PRESETURI_CULOARE.map((p) => `${p.nume} ${p.hex}`),
    [
      "Rosewood #5C1D24", "Bordeaux #4F0D1A", "Aubergine #3A0A26", "Plum #42163B",
      "Indigo #1F1646", "Bleumarin #0D1B38", "Safir #0A3463", "Teal #0A3D44",
      "Smarald #083D27", "Eucalipt #3A4637", "Oliv #3B3E19", "Espresso #2E1D14",
    ],
  );
  assert.equal(CULOARE_PROPUSA, "#0A3463");
  assert.equal(PRESETURI_CULOARE.find((p) => p.hex === CULOARE_PROPUSA)?.nume, "Safir");
  // Șablonul Claritate își păstrează culoarea: site-urile fără culori alese nu se schimbă.
  assert.equal(getTemplate("claritate").paleta.accent, "#1B5C99");
  // Toate 12 apar pe butoane EXACT cum sunt (sunt destul de închise pe orice șablon).
  for (const preset of PRESETURI_CULOARE) {
    for (const sablon of listTemplates()) assert.equal(paletaDinCuloare(sablon.paleta, preset.hex).paleta.accent, preset.hex, `${preset.nume} pe ${sablon.nume}`);
  }
});

test("niciun șablon nu are culoarea linkurilor: fără culori alese, nici linkuri noi, nici hover", () => {
  for (const sablon of listTemplates()) {
    assert.equal("accentInteractiv" in sablon.paleta, false, sablon.nume);
    assert.equal(templateStyle(sablon)["--t-accent-interactiv"], undefined, sablon.nume);
  }
  const ales = getTemplate("claritate", { mod: "auto", principala: "#0D3B66" });
  assert.equal(templateStyle(ales)["--t-accent-interactiv"], ales.paleta.accentInteractiv);
  assert.ok(esteHexValid(ales.paleta.accentInteractiv));
});

test("modul manual: „Linkurile” pornesc de la valoarea calculată și se pot schimba separat", () => {
  const sablon = getTemplate("claritate").paleta;
  // Fără culoare principală: paleta șablonului + DOAR culoarea linkurilor, citibilă.
  const baza = bazaManuala(sablon, null);
  assert.deepEqual({ ...baza, accentInteractiv: undefined }, { ...sablon, accentInteractiv: undefined });
  for (const f of [sablon.fundal, sablon.fundalNuantat, sablon.fundalRelief]) assert.ok(contrast(baza.accentInteractiv, f) >= 4.5);
  // Cu culoare principală: exact paleta calculată.
  assert.deepEqual(bazaManuala(sablon, "#0B4249"), paletaDinCuloare(sablon, "#0B4249").paleta);
  // Ecranul și site-ul pornesc din același loc.
  const efectiva = paletaEfectiva(sablon, citesteAspectCulori({ mod: "manual", manual: { text: "#111111" } }));
  assert.equal(efectiva.accentInteractiv, baza.accentInteractiv);
  // Schimbată de mână: se aplică exact, chiar dacă nu se citește — și se semnalează.
  const manuala = paletaEfectiva(sablon, citesteAspectCulori({ mod: "manual", principala: "#0D3B66", manual: { accentInteractiv: "#F0F0F0" } }));
  assert.equal(manuala.accentInteractiv, "#F0F0F0");
  const slabe = verificaPerechi(manuala).filter((x) => !x.trece).map((x) => x.nume);
  assert.ok(slabe.includes("Linkurile pe fundalul paginii"), slabe.join(" | "));
  // Salvarea acceptă a noua culoare.
  assert.equal(valideazaCulori({ mod: "manual", manual: { accentInteractiv: "#123456" } }).culori.manual.accentInteractiv, "#123456");
});

test("linkurile din text și hover-ul pe butoane: legate de rolul nou, cu rezervă pe culoarea veche", () => {
  const sectiune = citeste("src/components/site/section.tsx");
  // Linkurile: pe deschis, culoarea linkurilor CU rezervă pe accentul vechi; pe închis, ca înainte.
  assert.equal((sectiune.match(/: "var\(--t-accent-interactiv, var\(--t-accent\)\)",/g) ?? []).length, 3);
  assert.ok(sectiune.includes('inchis: "var(--t-accent-pe-inchis)",'));
  assert.ok(sectiune.includes('["--s-link" as string]: LINK[tone]'));
  // Hover: FĂRĂ rezervă (altfel ar apărea și la șabloane), iar pe închis `initial`.
  assert.equal((sectiune.match(/: "var\(--t-accent-interactiv\)",/g) ?? []).length, 3);
  assert.ok(sectiune.includes('inchis: "initial",'));
  assert.ok(sectiune.includes('["--s-buton-hover" as string]: BUTON_HOVER[tone]'));

  const css = citeste("src/app/globals.css");
  assert.match(css, /@media \(hover: hover\) \{\s*\.buton-plin:not\(:disabled\):hover \{\s*background: var\(--s-buton-hover, var\(--s-buton-fundal\)\) !important;/);

  // Butoanele pline au clasa; linkurile reale au culoarea linkurilor.
  for (const cale of ["src/components/site/sections/hero.tsx", "src/components/site/sections/about-teaser.tsx"]) {
    assert.ok(citeste(cale).includes('className="buton-plin"'), cale);
  }
  for (const cale of [
    "src/components/site/sections/contact-form.tsx",
    "src/components/site/sections/newsletter-form.tsx",
    "src/components/site/sections/programare-rapida.tsx",
    "src/app/programare/formular.tsx",
  ]) {
    assert.ok(citeste(cale).includes('className="buton-plin" style={stilButonTrimite(seLucreaza)}'), cale);
  }
  for (const cale of [
    "src/components/site/sections/features.tsx",
    "src/components/site/sections/latest-posts.tsx",
    "src/components/site/sections/articol-complet.tsx",
    "src/components/site/sections/contact-form.tsx",
  ]) {
    assert.ok(citeste(cale).includes('color: "var(--s-link, var(--s-accent))"'), cale);
  }
  for (const cale of ["src/components/site/card-articol.tsx", "src/components/site/sections/features.tsx"]) {
    assert.ok(citeste(cale).includes('color: "var(--t-accent-interactiv, var(--t-accent))"'), cale);
  }
});

test("mostrele culorilor gata alese: trei fâșii (50% banda închisă, 30% butoane, 20% linkuri), calculate ca pe site", () => {
  const ecran = citeste("src/app/dashboard/aspect/formular.tsx");
  assert.ok(ecran.includes("paleta: paletaDinCuloare(sablon.paleta, preset.hex).paleta"), "aceeași funcție ca pe site");
  // Banda și butonul arătate cu mătasea lor, ca pe site.
  assert.ok(ecran.includes('style={{ flex: "50 1 0", background: preset.paleta.fundalInchisMatase ?? preset.paleta.fundalInchis }}'));
  assert.ok(ecran.includes('style={{ flex: "30 1 0", background: preset.paleta.accentMatase ?? preset.paleta.accent }}'));
  assert.ok(ecran.includes('style={{ flex: "20 1 0", background: preset.paleta.accentInteractiv }}'));
  // Fundalul cardurilor e același la toate culorile, deci nu mai are ce căuta în mostră.
  assert.ok(!ecran.includes("background: preset.paleta.fundalNuantat"));
  assert.ok(ecran.includes("de la stânga: banda închisă, butoanele și linkurile"));
  // Safir doar propus în câmp: nu se salvează până nu alege omul.
  assert.ok(ecran.includes("valoare={stare.principala ?? CULOARE_PROPUSA}"));
  assert.ok(ecran.includes("const baza = bazaManuala(sablon.paleta, stare.principala);"));
});

test("hover-ul se vede și în previzualizarea din „Aspect”, fără ca previzualizarea să devină folosibilă", () => {
  const cadru = citeste("src/components/dashboard/cadru-previzualizare.tsx");
  // `inert` rămâne: un Tab din formular nu aterizează în butoanele site-ului fals, click-ul nu face nimic.
  assert.ok(cadru.includes('doc.body.setAttribute("inert", "");'));
  // Hover-ul e oprit implicit și pornit doar la cerere.
  assert.ok(cadru.includes("hoverPeButoane = false,"));
  assert.ok(cadru.includes("if (!hoverPeButoane || !document_) return;"));
  // Butonul de sub maus se găsește după dreptunghi (`elementsFromPoint` nu vede elementele inerte).
  assert.ok(cadru.includes('doc.querySelectorAll(".buton-plin")') && cadru.includes("getBoundingClientRect()"));
  assert.ok(cadru.includes('buton?.setAttribute("data-hover", "")') && cadru.includes('activ?.removeAttribute("data-hover")'));
  // Și se curăță: la ieșirea mausului și la demontare.
  assert.ok(cadru.includes('addEventListener("mouseleave", pleaca)') && cadru.includes('removeEventListener("mousemove", muta)'));

  // Aceeași culoare ca hover-ul adevărat, fără media query (previzualizarea n-are `:hover`).
  const css = citeste("src/app/globals.css");
  assert.match(css, /\n\.buton-plin\[data-hover\]:not\(:disabled\) \{\s*background: var\(--s-buton-hover, var\(--s-buton-fundal\)\) !important;/);

  // Doar „Aspect” îl pornește; restul previzualizărilor rămân cum erau.
  assert.ok(citeste("src/components/dashboard/panou-previzualizare.tsx").includes("<CadruPrevizualizare latime={latime} hoverPeButoane={hoverPeButoane}>"));
  assert.match(citeste("src/app/dashboard/aspect/formular.tsx"), /titlu="Cum arată cu ce ai ales"[\s\S]{0,140}hoverPeButoane\n/);
  for (const cale of ["src/app/dashboard/sectiuni/[id]/editor.tsx", "src/app/dashboard/setari/formular.tsx"]) {
    assert.ok(!citeste(cale).includes("hoverPeButoane"), cale);
  }
});

test("banda cu servicii a „Clarității”: piatră caldă pe un site cu culori alese, amestecul de până acum fără", () => {
  // Pe Smarald, amestecul de 8% din culoarea butonului ieșea gri-verzui (găsit în browser, 19 oct.).
  for (const sablon of listTemplates()) {
    assert.equal("fundalBanda" in sablon.paleta, false, `${sablon.nume}: niciun șablon nu are rolul`);
    assert.equal(templateStyle(sablon)["--t-fundal-banda"], undefined);
  }
  for (const culoare of ["#0E3A2F", "#0B4249", "#5E121D", "#FFEB3B"]) {
    const p = paletaDinCuloare(getTemplate("claritate").paleta, culoare).paleta;
    assert.equal(p.fundalBanda, p.fundalRelief, culoare);
    assert.equal(p.fundalBanda, "#E8E2D5", `${culoare}: banda cu servicii pe calcar`);
    // Textul discret și steaua (accentul) se citesc pe ea.
    assert.ok(contrast(p.textSecundar, p.fundalBanda) >= 4.5 && contrast(p.accent, p.fundalBanda) >= 4.5, culoare);
  }
  const ales = getTemplate("claritate", { mod: "auto", principala: "#0E3A2F" });
  assert.equal(templateStyle(ales)["--t-fundal-banda"], ales.paleta.fundalRelief);
  // Modul manual: schimbi fundalul paginii → relieful și banda se mută împreună.
  const manual = paletaEfectiva(getTemplate("claritate").paleta, citesteAspectCulori({ mod: "manual", principala: "#0E3A2F", manual: { fundal: "#FFF0F0" } }));
  assert.equal(manual.fundalBanda, manual.fundalRelief);
  // Componenta: rolul nou, CU rezervă pe amestecul vechi.
  assert.ok(citeste("src/components/site/sections/banda-servicii.tsx").includes(
    '"var(--t-fundal-banda, color-mix(in oklab, var(--t-accent) 8%, var(--t-fundal)))"',
  ));
});

test("mătasea („Silk & Velvet”): pe benzi, subsol, cartonașele închise și butoanele pline — DOAR ca fundal, doar cu culori alese", () => {
  // Niciun șablon n-are mătase: fără culori alese, totul cade pe culoarea plină de până acum.
  for (const sablon of listTemplates()) {
    for (const rol of ["fundalInchisMatase", "accentMatase"]) assert.equal(rol in sablon.paleta, false, `${sablon.nume}: ${rol}`);
    assert.equal(templateStyle(sablon)["--t-fundal-inchis-matase"], undefined);
    assert.equal(templateStyle(sablon)["--t-accent-matase"], undefined);
  }
  const ales = getTemplate("claritate", { mod: "auto", principala: "#083D27" });
  assert.equal(templateStyle(ales)["--t-fundal-inchis-matase"], ales.paleta.fundalInchisMatase);
  assert.equal(templateStyle(ales)["--t-accent-matase"], ales.paleta.accentMatase);

  const sectiune = citeste("src/components/site/section.tsx");
  assert.ok(sectiune.includes('inchis: "var(--t-fundal-inchis-matase, var(--t-fundal-inchis))",'), "banda: mătase cu rezervă pe culoarea plină");
  assert.equal((sectiune.match(/: "var\(--t-accent-matase\)",/g) ?? []).length, 3, "butoanele pe deschis: mătase FĂRĂ rezervă");
  assert.ok(sectiune.includes('["--s-buton-matase" as string]: BUTON_MATASE[tone]'));
  // `--s-buton-fundal` e și culoare de CHENAR (orele din calendar): acolo un gradient e nevalid și
  // chenarul ar dispărea. Deci harta lui nu are voie să atingă mătasea.
  const butonFundal = sectiune.slice(sectiune.indexOf("const BUTON_FUNDAL"), sectiune.indexOf("};", sectiune.indexOf("const BUTON_FUNDAL")));
  assert.ok(butonFundal.length > 20 && !butonFundal.includes("matase"), butonFundal);
  // Subsolul și cartonașele mici închise (antetul, „Despre mine", „Contact") au mătasea benzii.
  for (const cale of ["src/components/site/footer.tsx", "src/components/site/header.tsx", "src/components/site/sections/about-teaser.tsx", "src/components/site/sections/contact.tsx"]) {
    assert.ok(citeste(cale).includes('background: "var(--t-fundal-inchis-matase, var(--t-fundal-inchis))"'), cale);
    assert.ok(!citeste(cale).includes('background: "var(--t-fundal-inchis)"'), `${cale}: a rămas un fundal închis plin, fără mătase`);
  }
  for (const cale of ["src/components/site/sections/hero.tsx", "src/components/site/sections/about-teaser.tsx", "src/components/site/form-parts.tsx"]) {
    assert.ok(citeste(cale).includes('background: "var(--s-buton-matase, var(--s-buton-fundal))"'), cale);
  }
  // Gradientul nu ajunge NICIODATĂ într-o culoare de chenar sau de text: orele din calendar își
  // țin chenarul pe `--s-buton-fundal`, care rămâne culoare plină.
  for (const cale of ["src/components/site/calendar.tsx", "src/components/site/sections/programare-rapida.tsx", "src/app/programare/formular.tsx"]) {
    const text = citeste(cale);
    assert.ok(text.includes('"1px solid var(--s-buton-fundal)"'), cale);
    assert.ok(!text.includes("matase"), `${cale}: mătasea nu are ce căuta în chenare`);
  }
  assert.ok(!/--t-accent\b[^-]/.test(templateStyle(ales)["--t-accent-matase"]), "gradientul e făcut din culori, nu din variabile");

  // Modul manual: mătasea se reface din culorile FINALE.
  const manual = paletaEfectiva(getTemplate("claritate").paleta, citesteAspectCulori({ mod: "manual", principala: "#083D27", manual: { fundalInchis: "#102030", accent: "#5C1D24" } }));
  assert.ok(manual.fundalInchisMatase.includes(" #102030 50%"), manual.fundalInchisMatase);
  assert.ok(manual.accentMatase.includes(" #5C1D24 50%"), manual.accentMatase);
  // Avertismentele includ și partea luminoasă a benzii (unde contrastul e cel mai mic).
  const nume = perechiDeContrast(manual).map((x) => x.nume);
  assert.ok(nume.includes("Textul de pe fundalul închis, pe partea luminoasă a benzii"), nume.join(" | "));
  assert.ok(nume.includes("Textul de pe butoane, pe partea luminoasă a butonului"));
});
