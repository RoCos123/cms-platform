import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTemplate, listTemplates, templateStyle } from "@/lib/templates";
import {
  FONTURI_TEXT,
  FONTURI_TITLU,
  PERECHI_FONTURI,
  citesteAspectFonturi,
  fonturiDinBrand,
  tipografieEfectiva,
} from "@/lib/aspect/fonturi";
import { brandCuCulori, brandCuFonturi, valideazaFonturi } from "@/lib/aspect/salvare";
import { fonturiPermise } from "@/lib/aspect/acces";

/**
 * Fonturile alese de client (meniul „Aspect"). `pnpm test:logica`.
 *
 * Cerut de proprietar (20 oct. 2026): un font pentru titluri și unul pentru text, dintr-o listă
 * aleasă, plus „5 combinații sau mai multe" gata făcute. Ce apără probele:
 *
 * 1. LISTELE sunt exact cele aprobate (după ce le-a văzut puse pe un site), fiecare font e
 *    declarat în `next/font` cu `latin-ext`, iar fonturile fără ș/ț nu intră;
 * 2. SITE-URILE FĂRĂ FONTURI ALESE nu se schimbă: `getTemplate` întoarce chiar obiectul
 *    șablonului, iar componentele cad pe exact ce aveau înainte;
 * 3. REGULA: textul schimbă doar textul; titlul schimbă titlurile, accentele, cifrele, citatele,
 *    cu grosimea fontului; TOATE titlurile au un font de titlu explicit (pe Claritate, cinci
 *    secțiuni își scriau titlul cu fontul de text);
 * 4. salvarea și poarta, ca la culori.
 */

const citeste = (cale) => readFileSync(cale, "utf8");
const FONTURI_TS = citeste("src/lib/templates/fonturi.ts");

// ───────────────────────── listele ─────────────────────────

test("fonturile de titlu: exact cele 11 aprobate, câte unul din fiecare stil, în ordinea arătată", () => {
  assert.deepEqual(
    FONTURI_TITLU.map((f) => [f.stil, f.nume, f.greutate]),
    [
      ["Neutru", "Inter", 700],
      ["Geometric", "Josefin Sans", 600],
      ["Rotunjit, prietenos", "Quicksand", 600],
      ["Cu personalitate", "Bricolage Grotesque", 600],
      ["De revistă", "Playfair Display", 500],
      ["Clasic, fin", "Cormorant Garamond", 500],
      ["Moale, cald", "Fraunces", 500],
      ["Solid", "Zilla Slab", 600],
      ["Sculptat, aerisit", "Tenor Sans", 400],
      ["Îngust, rafinat", "Instrument Serif", 400],
      ["Scris de mână", "Caveat", 600],
    ],
  );
  // Cursivele: doar unde fișierul declarat chiar le are (altfel le fabrică browserul).
  assert.deepEqual(
    FONTURI_TITLU.filter((f) => !f.cursive).map((f) => f.nume),
    ["Inter", "Quicksand", "Bricolage Grotesque", "Tenor Sans", "Caveat"],
  );
});

test("fonturile de text: cele 8 plus cele două rezerve, toate păstrate de proprietar", () => {
  assert.deepEqual(FONTURI_TEXT.map((f) => f.nume), [
    "Inter", "DM Sans", "Nunito", "Source Sans 3", "Figtree", "Lora", "Source Serif 4", "Literata", "Manrope", "Newsreader",
  ]);
});

test("fonturile fără ș sau ț nu intră, deși Google le declară cu `latin-ext`", () => {
  // Verificat pe fișierele adevărate pe 20 oct. 2026: Marcellus și Philosopher n-au ș, ț;
  // Poiret One n-are ț. Pe un site românesc, jumătate din cuvinte ar cădea pe alt font.
  const toate = [...FONTURI_TITLU, ...FONTURI_TEXT].map((f) => f.nume);
  for (const exclus of ["Marcellus", "Philosopher", "Poiret One"]) assert.ok(!toate.includes(exclus), exclus);
});

test("fiecare font din liste e declarat în `next/font`, cu `latin-ext`, și are numele în tabelul de familii", () => {
  const nume = new Set([...FONTURI_TITLU, ...FONTURI_TEXT].map((f) => f.nume));
  for (const font of nume) {
    const cheie = /\s/.test(font) ? `"${font}":` : `${font}:`;
    assert.ok(FONTURI_TS.includes(`  ${cheie} `), `${font} lipsește din FAMILII`);
    const importat = font.replace(/ /g, "_");
    assert.match(FONTURI_TS, new RegExp(`\\b${importat}\\(\\{`), `${font} nu e declarat`);
  }
  // Toate declarațiile, fără excepție: latin-ext și fără preîncărcare.
  const declaratii = FONTURI_TS.match(/= [A-Z][A-Za-z_0-9]*\(\{[\s\S]*?\}\);/g) ?? [];
  assert.equal(declaratii.length, 20, "6 ale șabloanelor + 14 noi");
  for (const d of declaratii) {
    assert.ok(d.includes('subsets: ["latin", "latin-ext"]'), d);
    assert.ok(d.includes("preload: false"), d);
    assert.ok(d.includes('display: "swap"'), d);
  }
  // Un font cu cursive declarate pe lista de titluri are și fișierul de cursive.
  for (const f of FONTURI_TITLU.filter((x) => x.cursive)) {
    const d = declaratii.find((x) => x.includes(`${f.nume.replace(/ /g, "_")}({`));
    assert.ok(d?.includes('style: ["normal", "italic"]'), `${f.nume}: cursivele nu sunt cerute`);
  }
});

test("fiecare font de titlu are lățimea literei măsurată (reperele din „Despre mine”)", () => {
  for (const f of FONTURI_TITLU) {
    const cheie = /\s/.test(f.nume) ? `"${f.nume}"` : f.nume;
    assert.match(FONTURI_TS, new RegExp(`\\n  ${cheie}: 0\\.\\d+,`), `${f.nume}: lipsește din LATIME_LITERA`);
  }
});

test("perechile gata alese: cel puțin 5, cu nume unice, din fonturile listelor, fără dubluri", () => {
  assert.ok(PERECHI_FONTURI.length >= 5);
  assert.equal(new Set(PERECHI_FONTURI.map((p) => p.nume)).size, PERECHI_FONTURI.length);
  assert.equal(new Set(PERECHI_FONTURI.map((p) => `${p.titluri}|${p.text}`)).size, PERECHI_FONTURI.length);
  for (const p of PERECHI_FONTURI) {
    assert.ok(FONTURI_TITLU.some((f) => f.nume === p.titluri), p.titluri);
    assert.ok(FONTURI_TEXT.some((f) => f.nume === p.text), p.text);
    assert.notEqual(p.titluri, p.text, `${p.nume}: o pereche are două fonturi diferite`);
  }
});

// ───────────────────────── citirea din bază ─────────────────────────

test("un JSON din bază: ce e în liste se păstrează, restul se aruncă în tăcere", () => {
  for (const nimic of [undefined, null, 5, "Lora", [], {}, { titluri: "Comic Sans" }, { text: "Marcellus" }, { titluri: null, text: "" }]) {
    assert.equal(citesteAspectFonturi(nimic), null, JSON.stringify(nimic));
  }
  assert.deepEqual(citesteAspectFonturi({ titluri: "Fraunces", text: "Arial" }), { titluri: "Fraunces", text: null });
  assert.deepEqual(citesteAspectFonturi({ titluri: 7, text: "Lora", altceva: 1 }), { titluri: null, text: "Lora" });
  // Un font de text nu e și de titlu (și invers): fiecare listă cu ale ei.
  assert.deepEqual(citesteAspectFonturi({ titluri: "Lora", text: "Caveat" }), null);
});

// ───────────────────────── aplicarea ─────────────────────────

test("`getTemplate` fără fonturi întoarce EXACT șablonul — site-urile existente nu se schimbă", () => {
  for (const sablon of listTemplates()) {
    for (const nimic of [undefined, null, {}, { titluri: "Comic Sans" }, "Lora"]) {
      assert.equal(getTemplate(sablon.id, undefined, nimic), sablon, JSON.stringify(nimic));
    }
    // Fără fonturi alese, nicio variabilă nouă: componentele cad pe exact ce aveau.
    const stil = templateStyle(sablon);
    assert.equal(stil["--t-greutate-titlu-ales"], undefined, sablon.nume);
    assert.equal(stil["--t-cursiv-secundar"], undefined, sablon.nume);
    assert.equal(stil["--t-stil-accent-titlu"], undefined, sablon.nume);
    assert.equal(sablon.tipografie.fontTitlu, undefined, `${sablon.nume}: niciun șablon nu are fontTitlu`);
  }
});

test("cu fonturi alese se schimbă DOAR tipografia; culorile alese rămân, la fel formele și așezările", () => {
  const culori = { mod: "auto", principala: "#0A3463" };
  const doarCulori = getTemplate("claritate", culori);
  const ambele = getTemplate("claritate", culori, { titluri: "Fraunces", text: "Figtree" });
  assert.deepEqual(ambele.paleta, doarCulori.paleta);
  assert.equal(ambele.forme, doarCulori.forme);
  assert.equal(ambele.asezari, doarCulori.asezari);
  assert.notEqual(ambele.tipografie, doarCulori.tipografie);

  const doarFonturi = getTemplate("claritate", undefined, { titluri: "Fraunces" });
  assert.equal(doarFonturi.paleta, getTemplate("claritate").paleta, "fără culori, paleta e chiar a șablonului");
});

/** Regula, scrisă din nou aici, independent de cod. */
function asteptat(sablon, titluri, text) {
  const t = sablon.tipografie;
  const titluSablon = t.titluriInSecundar ? t.fontSecundar : t.fontPrincipal;
  const ft = FONTURI_TITLU.find((f) => f.nume === titluri);
  const fx = FONTURI_TEXT.find((f) => f.nume === text);
  return {
    principal: fx ? fx.nume : t.fontPrincipal,
    secundar: ft ? ft.nume : t.fontSecundar,
    titlu: ft ? ft.nume : titluSablon,
    greutate: ft ? ft.greutate : t.greutateTitlu,
    accentInItalic: ft ? t.accentInItalic && ft.cursive : t.accentInItalic,
    faraCursive: ft ? !ft.cursive : undefined,
    // Partea evidențiată din titluri: cursivă la orice font ales care are cursive (20 oct.).
    titluCursiv: ft ? ft.cursive : undefined,
  };
}

test("regula, pe toate combinațiile × cele cinci șabloane: textul schimbă textul, titlul schimbă titlurile", () => {
  let n = 0;
  for (const sablon of listTemplates()) {
    for (const titluri of [null, ...FONTURI_TITLU.map((f) => f.nume)]) {
      for (const text of [null, ...FONTURI_TEXT.map((f) => f.nume)]) {
        if (!titluri && !text) continue;
        const t = getTemplate(sablon.id, undefined, { titluri, text }).tipografie;
        const e = asteptat(sablon, titluri, text);
        const caz = `${sablon.nume}: ${titluri} + ${text}`;
        assert.equal(t.fontPrincipal, e.principal, caz);
        assert.equal(t.fontSecundar, e.secundar, caz);
        assert.equal(t.fontTitlu, e.titlu, `${caz}: titlurile au mereu un font explicit`);
        assert.equal(t.greutateTitlu, e.greutate, caz);
        assert.equal(t.accentInItalic, e.accentInItalic, caz);
        assert.equal(t.secundarFaraCursive, e.faraCursive, caz);
        assert.equal(t.accentTitluCursiv, e.titluCursiv, caz);

        const stil = templateStyle(getTemplate(sablon.id, undefined, { titluri, text }));
        assert.equal(stil["--t-greutate-titlu-ales"], String(e.greutate), caz);
        assert.equal(stil["--t-cursiv-secundar"], e.faraCursive ? "normal" : undefined, caz);
        assert.equal(stil["--t-stil-accent"], e.accentInItalic ? "italic" : "normal", caz);
        assert.equal(stil["--t-stil-accent-titlu"], e.titluCursiv ? "italic" : undefined, caz);
        n++;
      }
    }
  }
  assert.equal(n, 5 * (12 * 11 - 1));
});

test("pe Claritate, un font de TEXT ales nu schimbă titlurile: rămân Inter 700, ca acum", () => {
  const t = getTemplate("claritate", undefined, { titluri: null, text: "Lora" }).tipografie;
  assert.equal(t.fontPrincipal, "Lora");
  assert.equal(t.fontTitlu, "Inter");
  assert.equal(t.greutateTitlu, 700);
  // Și pe Căldură: titlurile Manrope, accentele Cormorant — neatinse.
  const c = getTemplate("caldura", undefined, { text: "Literata" }).tipografie;
  assert.deepEqual([c.fontTitlu, c.fontSecundar, c.fontPrincipal], ["Manrope", "Cormorant Garamond", "Literata"]);
});

test("`tipografieEfectiva` nu modifică tipografia șablonului primită", () => {
  const sablon = getTemplate("liniste");
  const copie = JSON.stringify(sablon.tipografie);
  tipografieEfectiva(sablon.tipografie, { titluri: "Caveat", text: "Lora" });
  assert.equal(JSON.stringify(sablon.tipografie), copie);
});

// ───────────────────────── componentele ─────────────────────────

test("cele cinci secțiuni fără `titluSerif` iau fontul titlurilor ales — și, fără alegere, exact ce aveau", () => {
  for (const f of ["about-teaser", "faq", "how-it-works", "newsletter", "testimonials"]) {
    const sursa = citeste(`src/components/site/sections/${f}.tsx`);
    assert.ok(sursa.includes('fontFamily: "var(--t-font-titlu-ales, inherit)",'), f);
    assert.ok(sursa.includes('fontWeight: "var(--t-greutate-titlu-ales, 700)" as unknown as number,'), `${f}: fără alegere, tot 700`);
    assert.ok(!sursa.includes(": { fontWeight: 700 }),"), `${f}: a rămas varianta veche, fără fontul titlurilor`);
  }
  // Variabila de font se pune DOAR cu fonturi alese.
  assert.ok(FONTURI_TS.includes('...(t.fontTitlu && { "--t-font-titlu-ales": titlu }),'));
});

test("cursivele scrise de mână în cod pe fontul secundar ascultă de un font ales fără cursive", () => {
  // `|| true`: grep fără nicio potrivire iese cu 1, iar asta e exact rezultatul dorit.
  const gasite = execFileSync("sh", ["-c", `grep -rn 'fontStyle: .*"italic"' src/components/site || true`], { encoding: "utf8" })
    .split("\n").filter(Boolean);
  assert.deepEqual(gasite, [], "orice cursiv fix pe fontul secundar trebuie să treacă prin --t-cursiv-secundar");
  assert.equal((citeste("src/components/site/sections/banda-servicii.tsx").match(/var\(--t-cursiv-secundar, italic\)/g) ?? []).length, 2);
  assert.equal((citeste("src/components/site/sections/hero.tsx").match(/var\(--t-cursiv-secundar, italic\)/g) ?? []).length, 1);
});

test("a doua parte a titlului: cursivă cu un font ales care are cursive — doar în titluri, fără culoare", () => {
  // Prins de proprietar: pe Claritate singura diferență era grosimea, iar Playfair, Instrument
  // Serif, Tenor Sans, Caveat n-au tăietură subțire — „în ritmul tău" arăta ca prima parte.
  // A ales: „doar cursiv acolo unde se poate, fără culoare".
  const titluri = [
    "src/components/site/sections/hero.tsx",
    "src/components/site/section-heading.tsx",
    "src/components/site/sections/about-teaser.tsx",
    "src/components/site/sections/testimonials.tsx",
    "src/components/site/sections/contact.tsx",
    "src/components/site/sections/how-it-works.tsx",
    "src/components/site/sections/faq.tsx",
    "src/components/site/sections/newsletter.tsx",
  ];
  const gasite = execFileSync("sh", ["-c", "grep -rln 'var(--t-stil-accent-titlu, var(--t-stil-accent))' src/components || true"], { encoding: "utf8" })
    .split("\n").filter(Boolean).sort();
  assert.deepEqual(gasite, [...titluri].sort());
  for (const cale of titluri) {
    // Fiecare stă pe partea evidențiată a unui titlu, nu pe un citat.
    const sursa = citeste(cale);
    const i = sursa.indexOf("var(--t-stil-accent-titlu, var(--t-stil-accent))");
    assert.ok(sursa.lastIndexOf("titluAccent", i) > sursa.lastIndexOf("</h", i), `${cale}: nu e în partea evidențiată a unui titlu`);
  }
  // Citatele, recenziile, fraza din „Despre mine" și datele din „Contact" rămân pe regula șablonului.
  const rest = execFileSync("sh", ["-c", `grep -rn 'fontStyle: "var(--t-stil-accent)"' src/components || true`], { encoding: "utf8" })
    .split("\n").filter(Boolean).map((l) => l.split(":")[0]).sort();
  assert.deepEqual(rest, [
    "src/components/site/sections/about-teaser.tsx",
    "src/components/site/sections/about-teaser.tsx",
    "src/components/site/sections/contact.tsx",
    "src/components/site/sections/quote.tsx",
    "src/components/site/sections/quote.tsx",
    "src/components/site/sections/testimonials.tsx",
  ]);
  // Pe Claritate: Playfair → titluri cursive, citatele drepte; Tenor Sans → nimic cursiv.
  const playfair = templateStyle(getTemplate("claritate", undefined, { titluri: "Playfair Display" }));
  assert.equal(playfair["--t-stil-accent-titlu"], "italic");
  assert.equal(playfair["--t-stil-accent"], "normal", "citatele rămân drepte, ca pe Claritate");
  const tenor = templateStyle(getTemplate("claritate", undefined, { titluri: "Tenor Sans" }));
  assert.equal(tenor["--t-stil-accent-titlu"], undefined);
  assert.equal(tenor["--t-stil-accent"], "normal");
  // Fără culoare: nicio variabilă nouă de culoare pentru titluri.
  assert.equal(playfair["--t-accent-titlu"], undefined);
});

// ───────────────────────── salvarea și poarta ─────────────────────────

test("salvare: doar nume din liste; un font necunoscut se SPUNE, nu se salvează", () => {
  assert.deepEqual(valideazaFonturi(null), { ok: true, fonturi: null });
  assert.deepEqual(valideazaFonturi({ titluri: "", text: null }), { ok: true, fonturi: null });
  assert.deepEqual(valideazaFonturi({ titluri: "Fraunces", text: "Figtree", x: 1 }), { ok: true, fonturi: { titluri: "Fraunces", text: "Figtree" } });
  assert.deepEqual(valideazaFonturi({ text: "Lora" }), { ok: true, fonturi: { titluri: null, text: "Lora" } });
  const titlu = valideazaFonturi({ titluri: "Comic Sans" });
  assert.equal(titlu.ok, false);
  assert.match(titlu.mesaj, /titluri/);
  const text = valideazaFonturi({ text: "Caveat" });
  assert.equal(text.ok, false, "Caveat e font de titlu, nu de text");
  assert.match(text.mesaj, /text/);
  for (const stricat of [5, "Lora", [], undefined]) assert.equal(valideazaFonturi(stricat).ok, false, JSON.stringify(stricat));
});

test("fonturile se pun în `brand` fără să atingă culorile sau datele din Setări (și invers)", () => {
  const culori = { mod: "auto", principala: "#2E7D5B", manual: {}, asumat: false };
  const fonturi = { titluri: "Fraunces", text: null };
  const brand = { telefon: "0722", aspect: { culori } };

  const cu = brandCuFonturi(brand, fonturi);
  assert.deepEqual(cu, { telefon: "0722", aspect: { culori, fonturi } });
  assert.deepEqual(brand, { telefon: "0722", aspect: { culori } }, "brand-ul primit nu se modifică pe loc");
  assert.deepEqual(brandCuFonturi(cu, null), brand);
  assert.deepEqual(brandCuCulori(cu, null), { telefon: "0722", aspect: { fonturi } }, "scoaterea culorilor lasă fonturile");
  assert.deepEqual(brandCuFonturi(brandCuCulori(cu, null), null), { telefon: "0722" }, "`aspect` gol dispare");
  assert.deepEqual(citesteAspectFonturi(fonturiDinBrand(cu)), fonturi, "ce s-a salvat se citește înapoi la fel");
});

test("poarta: fonturile salvate NU ajung pe un site din afara probei", () => {
  const brand = { aspect: { fonturi: { titluri: "Caveat", text: "Lora" } } };
  const liste = { sabloane: ["claritate"], domenii: ["proba.ro"] };
  assert.deepEqual(fonturiPermise(brand, { domain: "proba.ro", template: "claritate" }, liste), brand.aspect.fonturi);
  for (const site of [{ domain: "alt.ro", template: "claritate" }, { domain: "proba.ro", template: "liniste" }, { domain: null, template: "claritate" }]) {
    assert.equal(fonturiPermise(brand, site, liste), undefined, JSON.stringify(site));
    const sablon = getTemplate(site.template);
    assert.equal(getTemplate(site.template, undefined, fonturiPermise(brand, site, liste)), sablon);
  }
});

test("site-ul public și toate previzualizările din panou citesc fonturile alese — doar prin poartă", () => {
  assert.ok(citeste("src/components/site/cadru-site.tsx").includes("fonturiPermise(brand, { domain, template: site?.template }),"));
  for (const cale of [
    "src/app/dashboard/sectiuni/[id]/page.tsx",
    "src/app/dashboard/servicii/[id]/page.tsx",
    "src/app/dashboard/setari/page.tsx",
    "src/app/dashboard/pagini/[id]/page.tsx",
    "src/app/dashboard/blog/[id]/page.tsx",
  ]) {
    const text = citeste(cale);
    assert.match(text, /culoriPermise\((setari\?\.brand|brand), (\{[^}]+\})\),\n\s+fonturiPermise\(\1, \2\),/, cale);
  }
  const gasite = execFileSync("grep", ["-rln", "fonturiDinBrand", "src"], { encoding: "utf8" }).split("\n").filter(Boolean).sort();
  assert.deepEqual(gasite, ["src/app/dashboard/aspect/page.tsx", "src/lib/aspect/acces.ts", "src/lib/aspect/fonturi.ts"]);
});

test("acțiunea salvează culorile și fonturile deodată: poartă, validare pentru amândouă, apoi scriere", () => {
  const actiune = citeste("src/app/dashboard/aspect/actions.ts");
  assert.ok(actiune.includes("export async function salveazaAspect(brut: unknown, brutFonturi: unknown)"));
  const [iPoarta, iCulori, iFonturi, iScriere] = [
    "aspectPermis({ domain: site?.domain, template: site?.template })",
    "valideazaCulori(brut)",
    "valideazaFonturi(brutFonturi)",
    ".upsert(",
  ].map((x) => actiune.indexOf(x));
  assert.ok(iPoarta >= 0 && iCulori > iPoarta && iFonturi > iCulori && iScriere > iFonturi);
  assert.ok(actiune.includes("if (!verificateFonturi.ok) return { ok: false, mesaj: verificateFonturi.mesaj };"));
  assert.ok(actiune.includes("brand: brandCuFonturi(brandCuCulori(existente?.brand, culori), fonturi)"));
});

test("ecranul: filele Culori/Fonturi, perechile și listele, salvarea comună, renunțarea le reia pe amândouă", () => {
  const ecran = citeste("src/app/dashboard/aspect/formular.tsx");
  assert.ok(ecran.includes("<AlegereFonturi"));
  assert.ok(ecran.includes("const efectiv = getTemplate(sablonId, fara, fonturiAlese);"), "previzualizarea vede fonturile");
  assert.ok(ecran.includes("await salveazaAspect(culori, fonturiAlese)"));
  assert.ok(ecran.includes("const modificat = culoriModificate || fonturiModificate;"));
  assert.ok(ecran.includes("setFonturi(referintaFonturi ?? { titluri: null, text: null });"), "Renunță reia și fonturile");
  assert.ok(ecran.includes("cheie={`${semnatura(culori)}|${semnaturaFonturi(fonturiAlese)}`}"));
  const pagina = citeste("src/app/dashboard/aspect/page.tsx");
  assert.ok(pagina.includes("citesteAspectFonturi(fonturiDinBrand(setari?.brand))"));
  const alegere = citeste("src/app/dashboard/aspect/alegere-fonturi.tsx");
  for (const x of ["PERECHI_FONTURI.map", "FONTURI_TITLU.map", "FONTURI_TEXT.map", "Ca în șablon", "Revino la fonturile șablonului"]) {
    assert.ok(alegere.includes(x), x);
  }
});
