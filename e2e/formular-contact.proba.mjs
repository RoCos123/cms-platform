import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { esteEmailValid, esteTelefonValid } from "@/lib/formulare";

/**
 * Formularul de contact al cabinetelor: nume, email OBLIGATORIU, telefon OPȚIONAL.
 * `pnpm test:logica`.
 *
 * Istoria, ca să se știe de ce stă așa: telefonul era obligatoriu (iunie), scos la
 * cererea proprietarului pe 16 sept. 2026 (emailul a devenit singurul canal), și
 * adus ÎNAPOI, opțional, pe 14 oct. 2026 — pe toate șabloanele deodată, fiindcă
 * formularul e o singură componentă (`ContactForm`). Textul liber rămâne scos
 * (GDPR, 28 aug.); asta apără `pagina-vanzare.proba.mjs`.
 *
 * Ce apără aici:
 * 1. emailul nu devine opțional odată cu telefonul — fără el, cine nu lasă numărul
 *    nu mai poate fi găsit de nimeni;
 * 2. telefonul nu devine obligatoriu și nu rămâne legat de pagina de vânzare;
 * 3. un număr scris prost e refuzat și pe cabinet, nu doar pe pagina de vânzare;
 * 4. un telefon gol nu ajunge în bază ca șir gol, ci ca „fără număr".
 */

const citeste = (cale) => readFileSync(cale, "utf8");
const actiune = () => citeste("src/app/actions/formulare.ts");
const formular = () => citeste("src/components/site/sections/contact-form.tsx");

/** Textul unui `<Camp … />` din formular, după `id`-ul lui. */
function camp(id) {
  const text = formular();
  const inceput = text.indexOf(`id="${id}"`);
  assert.ok(inceput >= 0, `câmpul ${id} a dispărut din formular`);
  return text.slice(text.lastIndexOf("<Camp", inceput), text.indexOf("/>", inceput));
}

test("formularul de cabinet are câmpul de telefon, în afara blocului paginii de vânzare", () => {
  const text = formular();
  const telefon = text.indexOf('id="contact-telefon"');
  const blocVanzare = text.indexOf("{modele && (");
  assert.ok(telefon >= 0, "lipsește câmpul de telefon");
  assert.ok(telefon < blocVanzare, "telefonul trebuie să stea ÎNAINTE de blocul care atârnă de `modele`");
});

test("telefonul e opțional, de tip „tel”, iar emailul rămâne obligatoriu", () => {
  const telefon = camp("contact-telefon");
  assert.ok(telefon.includes("obligatoriu={false}"), "telefonul nu are voie să fie obligatoriu");
  assert.ok(telefon.includes('tip="tel"'), "tip=tel aduce tastatura numerică pe telefon");

  const email = camp("contact-email");
  assert.ok(!email.includes("obligatoriu={false}"), "emailul trebuie să rămână obligatoriu");

  const nume = camp("contact-nume");
  assert.ok(!nume.includes("obligatoriu={false}"), "numele trebuie să rămână obligatoriu");
});

test("serverul citește telefonul pe ORICE site, nu doar pe cel de vânzare", () => {
  assert.ok(
    actiune().includes('const telefon = citesteText(formData, "telefon", LIMITE.telefon);'),
    "telefonul trebuie citit fără condiția `vanzare ?`",
  );
});

test("serverul cere emailul și îl verifică; telefonul gol trece, cel scris prost nu", () => {
  const text = actiune();
  assert.ok(text.includes("if (!email) erori.email"), "emailul trebuie să rămână obligatoriu pe server");
  assert.ok(!text.includes("if (!telefon) erori.telefon"), "telefonul nu are voie să fie cerut");

  // Verificarea numărului stă ÎNAINTE de blocul care atârnă de `vanzare && siteId`.
  const verificare = text.indexOf("if (telefon && !esteTelefonValid(telefon))");
  assert.ok(verificare >= 0, "lipsește verificarea telefonului");
  assert.ok(verificare < text.indexOf("if (vanzare && siteId)"), "verificarea telefonului nu poate atârna de pagina de vânzare");
});

test("în bază, un telefon gol e „fără număr” (null), nu un șir gol — pe ambele feluri de site", () => {
  const text = actiune();
  const insert = text.slice(text.indexOf("await tabel.insert("), text.indexOf("if (error) {", text.indexOf("await tabel.insert(")));
  assert.equal(insert.split("phone: telefon || null,").length - 1, 2, "ambele rânduri (vânzare și cabinet) scriu `phone: telefon || null`");
  assert.ok(!insert.includes("phone: null,"), "cabinetul nu mai scrie mereu `phone: null`");
});

test("telefonul se trimite înapoi cu restul valorilor, ca să nu se piardă la o eroare", () => {
  const text = actiune();
  assert.ok(text.includes(": { nume, email, telefon };"), "valorile unui cabinet trebuie să conțină telefonul");
});

test("regulile numărului: ce lasă omul în câmp, de la zero la cifre", () => {
  // Gol nu ajunge la `esteTelefonValid` (serverul sare peste), dar dacă ar ajunge, e refuzat.
  assert.equal(esteTelefonValid(""), false);
  for (const bun of ["0722 123 456", "0722.123.456", "+40 722 123 456", "(021) 123 45 67", "0040722123456"]) {
    assert.equal(esteTelefonValid(bun), true, bun);
  }
  for (const rau of ["ana@exemplu.ro", "sunați-mă", "12345", "0722 123 456 789 012 345", "+++40722123456"]) {
    assert.equal(esteTelefonValid(rau), false, rau);
  }
});

test("emailul nu s-a schimbat: forma cerută rămâne aceeași", () => {
  assert.equal(esteEmailValid("ana@exemplu.ro"), true);
  assert.equal(esteEmailValid("ana@exemplu"), false);
  assert.equal(esteEmailValid(""), false);
});
