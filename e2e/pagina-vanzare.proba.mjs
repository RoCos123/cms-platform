import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ATRIBUT_MODEL,
  TEXTE_VANZARE,
  dateleFirmei,
  modelulEsteValid,
  numeleModelelor,
  optiunileModelului,
  randurileDeContact,
  rindulLegal,
  tipulDinValoare,
} from "@/lib/pagina-vanzare";
import { esteTelefonValid } from "@/lib/formulare";
import { linkuriImplicite } from "@/lib/antet";
import { SECTIUNI } from "@/app/proba-vanzari/continut";

/**
 * Proba paginii de vânzare (brief 9 oct. 2026). `pnpm test:logica`.
 *
 * Ce apără, în ordinea gravității:
 * 1. un site de cabinet care primește telefon sau text liber prin formular — exact
 *    ce interzic hotărârile din 28 aug. și 16 sept. 2026;
 * 2. o listă de modele în formular care nu e cea din galerie;
 * 3. textele paginii de vânzare scrise prin componente, nu într-un singur loc.
 */

const citeste = (cale) => readFileSync(cale, "utf8");

test("doar valoarea „vanzare” face un site de vânzare; orice altceva e cabinet", () => {
  assert.equal(tipulDinValoare("vanzare"), "vanzare");
  for (const altceva of ["cabinet", "Vanzare", "vânzare", "", null, undefined, 1]) {
    assert.equal(tipulDinValoare(altceva), "cabinet", String(altceva));
  }
});

test("modelele se iau din galeria „vitrina”, în ordine, fără goluri și dubluri", () => {
  const randuri = [
    { key: "portfolio", variant: "vitrina", data: { elemente: [{ titlu: " Căldură " }, { titlu: "" }, { titlu: "Liniște" }] } },
    { key: "portfolio", variant: null, data: { elemente: [{ titlu: "Retreat la munte" }] } },
    { key: "features", variant: "vitrina", data: { elemente: [{ titlu: "Nu e galerie" }] } },
    { key: "portfolio", variant: "vitrina", data: { elemente: [{ titlu: "Căldură" }, { titlu: 7 }, null] } },
    { key: "portfolio", variant: "vitrina", data: null },
  ];
  assert.deepEqual(numeleModelelor(randuri), ["Căldură", "Liniște"]);
});

test("pe conținutul paginii de vânzare ies cele cinci modele din galerie", () => {
  assert.deepEqual(numeleModelelor(SECTIUNI), ["Căldură", "Liniște", "Lumină", "Apropiere", "Claritate"]);
});

test("„Încă nu m-am hotărât” e prima opțiune — și aleasă din start", () => {
  const optiuni = optiunileModelului(["Căldură", "Liniște"]);
  assert.deepEqual(optiuni, [TEXTE_VANZARE.formular.nehotarat, "Căldură", "Liniște"]);
  // Și fără nicio galerie, omul tot poate trimite.
  assert.deepEqual(optiunileModelului([]), [TEXTE_VANZARE.formular.nehotarat]);
});

test("serverul primește doar o opțiune din listă", () => {
  const modele = ["Căldură", "Liniște"];
  assert.equal(modelulEsteValid("Căldură", modele), true);
  assert.equal(modelulEsteValid(TEXTE_VANZARE.formular.nehotarat, modele), true);
  assert.equal(modelulEsteValid("Caldura", modele), false);
  assert.equal(modelulEsteValid("<script>", modele), false);
});

test("telefonul: 6–15 cifre, „+” în față, fără să conteze spațiile și liniuțele", () => {
  for (const bun of ["0722 123 456", "+40 722-123-456", "(021) 312.34.56", "0722123456"]) {
    assert.equal(esteTelefonValid(bun), true, bun);
  }
  for (const rau of ["nu am telefon", "ana@exemplu.ro", "12345", "0722 123 456 789 012 34", "07a2123456"]) {
    assert.equal(esteTelefonValid(rau), false, rau);
  }
});

test("serverul citește telefonul, mesajul și modelul DOAR pe un site de vânzare", () => {
  const actiune = citeste("src/app/actions/formulare.ts");
  for (const camp of ["telefon", "model", "mesaj"]) {
    assert.ok(
      actiune.includes(`vanzare ? citesteText(formData, "${camp}"`),
      `câmpul „${camp}” trebuie citit doar când site-ul e de vânzare`,
    );
  }
  // Hotărârea vine din marcajul site-ului, nu din ce trimite browserul.
  assert.ok(actiune.includes("await tipulSiteului(siteId)) === \"vanzare\""));
});

test("pe cabinet, rândul scris în bază rămâne cel de dinainte: fără telefon, fără text, fără model", () => {
  const actiune = citeste("src/app/actions/formulare.ts");
  const cabinet = actiune.slice(actiune.indexOf(": {\n            name: nume,"));
  assert.ok(cabinet.includes("phone: null,") && cabinet.includes("message: null,"));
  assert.ok(!cabinet.slice(0, cabinet.indexOf("},")).includes("model_preferat"), "cabinetul nu scrie model_preferat");
});

test("formularul arată câmpurile noi doar când primește lista de modele", () => {
  const formular = citeste("src/components/site/sections/contact-form.tsx");
  assert.ok(formular.includes("{modele && ("), "câmpurile noi trebuie să atârne de `modele`");
  const contact = citeste("src/components/site/sections/contact.tsx");
  assert.ok(contact.includes("modele={modele}"));
  const registru = citeste("src/components/site/render-sections.tsx");
  assert.ok(registru.includes("modele={ctx.paginaVanzare?.modele}"));
});

test("butonul „Vreau acest model” și formularul folosesc același atribut", () => {
  const galerie = citeste("src/components/site/sections/portfolio.tsx");
  assert.ok(galerie.includes("[ATRIBUT_MODEL]: numeModel"));
  assert.ok(galerie.includes('href="#contact"'));
  assert.ok(galerie.includes('target: "_blank", rel: "noopener noreferrer"'));
  const formular = citeste("src/components/site/sections/contact-form.tsx");
  assert.ok(formular.includes("a[${ATRIBUT_MODEL}]"));
  assert.equal(ATRIBUT_MODEL, "data-model");
});

test("galeria de vânzare are ancora „modele”, iar „programe” merge în continuare", () => {
  const galerie = citeste("src/components/site/sections/portfolio.tsx");
  assert.ok(galerie.includes('id={paginaVanzare ? "modele" : "programe"}'));
  // Reperul vechi există, și doar pe pagina de vânzare.
  const reper = galerie.indexOf('id="programe"');
  assert.ok(reper > 0, "ancora veche „programe” a dispărut");
  assert.ok(galerie.lastIndexOf("{paginaVanzare && (", reper) > 0);
});

test("„Modele” vine primul în bară, cu textul din TEXTE_VANZARE; restul meniului neschimbat", () => {
  const linkuri = linkuriImplicite({
    areDespre: false,
    paginaServicii: false,
    blog: null,
    paginiProprii: [],
    linkuriSectiuni: [{ text: "Prețuri", href: "/#pachete" }],
    linkuriDeInceput: [{ text: TEXTE_VANZARE.meniu.modele, href: "/#modele" }],
    etichete: TEXTE_VANZARE.meniu,
  });
  assert.deepEqual(
    linkuri.map((l) => `${l.text} ${l.href}`),
    ["Modele /#modele", "Servicii /#servicii", "Prețuri /#pachete", "Contact /#contact"],
  );
});

test("subsolul paginii de vânzare primește exact meniul din bară", () => {
  const cadru = citeste("src/components/site/cadru-site.tsx");
  assert.ok(cadru.includes("linkuri: meniuVanzare,"), "bara trebuie să primească meniul calculat");
  assert.ok(cadru.includes("linkuri: meniuVanzare.map("), "subsolul trebuie să primească același meniu");
});

test("cartonașul de distribuire are textul alternativ al paginii de vânzare, doar acolo", () => {
  const pagina = citeste("src/app/page.tsx");
  assert.ok(pagina.includes('...(tip === "vanzare" && {'));
  assert.ok(pagina.includes("alt: TEXTE_VANZARE.cartonasAlt"));
  // Al cabinetelor rămâne cel de până acum.
  assert.ok(citeste("src/app/opengraph-image.tsx").includes('export const alt = "Cartonașul de prezentare al cabinetului"'));
});

test("căsuța de mesaje nu cere pe nume coloana nouă (ar goli-o înaintea migrării)", () => {
  const mesaje = citeste("src/app/dashboard/mesaje/page.tsx");
  assert.ok(!mesaje.includes('select("id, name, email, phone, message'), "lista de coloane a revenit");
  assert.ok(mesaje.includes("rand.model_preferat"));
});

/*
 * Datele firmei (brief, punctul 4): o singură sursă — Setări → „Datele firmei",
 * doar pe pagina de vânzare — iar un câmp gol nu produce nimic pe pagină.
 */

test("datele firmei: câmpurile goale sau doar cu spații dispar cu totul", () => {
  assert.deepEqual(dateleFirmei({ firmaCui: "  ", firmaDenumire: " Exemplu SRL ", telefon: "0722" }), {
    denumire: "Exemplu SRL",
  });
  for (const gol of [null, undefined, "text", {}, { firmaCui: 7 }]) assert.deepEqual(dateleFirmei(gol), {});
});

test("rândul legal: doar bucățile completate, fiecare cu eticheta ei; gol = nimic", () => {
  assert.equal(rindulLegal({}), null);
  assert.equal(rindulLegal({ cui: "RO123" }), "CUI RO123");
  assert.equal(
    rindulLegal({ denumire: "Exemplu SRL", cui: "RO123", regCom: "J40/1/2026", sediu: "București" }),
    "Exemplu SRL · CUI RO123 · Nr. Reg. Com. J40/1/2026 · Sediu: București",
  );
  // Nicio etichetă rămasă fără valoare, nicio paranteză, niciun separator în plus.
  const doarSediu = rindulLegal({ sediu: "Cluj" });
  assert.equal(doarSediu, "Sediu: Cluj");
});

test("rândurile de lângă formular: doar cele completate, fiecare cu adresa potrivită", () => {
  assert.deepEqual(randurileDeContact({}), []);
  assert.deepEqual(randurileDeContact({ telefon: "0722 123 456", whatsapp: "0722 123 456", email: "a@b.ro" }), [
    { eticheta: "Telefon", valoare: "0722 123 456", href: "tel:0722123456" },
    { eticheta: "WhatsApp", valoare: "0722 123 456", href: "https://wa.me/40722123456" },
    { eticheta: "E-mail", valoare: "a@b.ro", href: "mailto:a@b.ro" },
  ]);
  // Un WhatsApp scris pe jumătate rămâne text, nu un link care nu duce nicăieri.
  assert.equal(randurileDeContact({ whatsapp: "0722" })[0].href, undefined);
});

test("Setări scrie „Datele firmei” doar pe un site de vânzare, oricât ar trimite browserul", () => {
  const actiune = citeste("src/app/dashboard/setari/actions.ts");
  assert.ok(actiune.includes('const cuFirma = firma !== undefined && (await tipulSiteului(session.siteId)) === "vanzare";'));
  assert.ok(actiune.includes(": brandCabinet;"), "fără firmă, brand-ul trebuie să rămână cel al cabinetului");
  const pagina = citeste("src/app/dashboard/setari/page.tsx");
  assert.ok(pagina.includes('firmaInitial={tip === "vanzare" ? catreEditor(brand, CAMPURI_FIRMA) : undefined}'));
});

test("datele firmei ajung în cele trei locuri cerute, și doar pe pagina de vânzare", () => {
  const registru = citeste("src/components/site/render-sections.tsx");
  assert.ok(registru.includes("mentiuneTva={ctx.paginaVanzare?.firma.tva}"));
  assert.ok(registru.includes("detaliiFirma={ctx.paginaVanzare ? randurileDeContact(ctx.paginaVanzare.firma) : undefined}"));
  const cadru = citeste("src/components/site/cadru-site.tsx");
  assert.ok(cadru.includes("rindLegal: rindulLegal(dateleFirmei(brand)),"));
  // Rândul legal stă în blocul care se pune doar când există meniul paginii de vânzare.
  assert.ok(cadru.indexOf("...(meniuVanzare && {") < cadru.indexOf("rindLegal:"));
});
