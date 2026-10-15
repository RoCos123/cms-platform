import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MAX_COPYRIGHT, randulDeCopyright } from "@/lib/copyright-subsol";
import { catreEditor, catreStocare, valideaza } from "@/lib/sectiuni-editare";
import { CAMPURI_CABINET } from "@/lib/setari";

/**
 * Rândul de copyright din subsol, scris de client (15 oct. 2026). `pnpm test:logica`.
 *
 * Cerut de proprietar: rândul din stânga al barei de jos („© 2026 Popescu Robert") se
 * compunea singur din anul de azi și numele cabinetului, deci nu se putea scrie cu
 * denumirea întreagă și CIF-ul. Acum are un câmp în Setări. Omul scrie doar textul;
 * „© " și anul curent se pun singure în față (a doua variantă — prima arăta „exact ce ai
 * scris" și îl obliga să-și găsească semnul © pe tastatură).
 *
 * Ce apără:
 * 1. CÂMPUL GOL = comportamentul de dinainte. Toate site-urile existente nu au câmpul;
 *    dacă „gol" ar însemna altceva, subsolul lor s-ar schimba fără ca cineva să fi cerut;
 * 2. „© " și anul se pun singure în fața textului scris — dar NICIODATĂ al doilea © peste
 *    unul scris de om (a scris deja rândul întreg, cum făcea prima variantă);
 * 3. câmpul se salvează, se reîncarcă și are o limită, ca orice câmp din Setări;
 * 4. subsolul de pe site și previzualizarea din Setări citesc același câmp, prin aceeași regulă.
 */

const citeste = (cale) => readFileSync(cale, "utf8");

test("fără text scris, rândul rămâne cel de până acum: © + anul + numele", () => {
  for (const gol of [undefined, null, "", "   ", "\n\t", 7, {}, []]) {
    assert.equal(randulDeCopyright(gol, 2026, "Popescu Robert"), "© 2026 Popescu Robert", JSON.stringify(gol));
  }
});

test("cu text scris, „© ” și anul curent apar singure în față — și numele cabinetului NU", () => {
  const text = "Cabinet Individual de Psihologie Popescu Cosmin Robert · CIF 54440949";
  assert.equal(randulDeCopyright(text, 2026, "Popescu Robert"), `© 2026 ${text}`);
  assert.equal(randulDeCopyright(text, 2027, "Popescu Robert"), `© 2027 ${text}`, "anul se schimbă singur");
  assert.equal(randulDeCopyright("  Toate drepturile rezervate.  ", 2026, "Popescu Robert"), "© 2026 Toate drepturile rezervate.");
  // Numele din antet nu se adaugă când omul a scris propriul text.
  assert.ok(!randulDeCopyright("Fără nimic altceva", 2026, "Popescu Robert").includes("Popescu"));
});

test("cine a scris deja semnul își are rândul gata: niciun al doilea © în față", () => {
  const gata = "© 2026 Cabinet Individual de Psihologie Popescu Cosmin Robert · CIF 54440949";
  assert.equal(randulDeCopyright(gata, 2027, "X"), gata, "rândul scris întreg, cu an cu tot, rămâne exact cum e");
  assert.equal(randulDeCopyright("©Cabinet", 2026, "X"), "©Cabinet");
  assert.equal(randulDeCopyright("(c) Cabinet", 2026, "X"), "(c) Cabinet");
  assert.equal(randulDeCopyright("Copyright Cabinet", 2026, "X"), "Copyright Cabinet");
  assert.equal(randulDeCopyright("copyright 2026 Cabinet", 2026, "X"), "copyright 2026 Cabinet");
  // Dar un cuvânt care doar începe cu aceleași litere nu e un semn de copyright.
  assert.equal(randulDeCopyright("Copyrighted Cabinet", 2026, "X"), "© 2026 Copyrighted Cabinet");
  assert.equal(randulDeCopyright("Cabinet (c) 2026", 2026, "X"), "© 2026 Cabinet (c) 2026");
});

test("{an} din text devine anul curent — oriunde, de câte ori apare, cu litere mari sau mici", () => {
  assert.equal(randulDeCopyright("© {an} Cabinet · CIF 54440949", 2026, "X"), "© 2026 Cabinet · CIF 54440949");
  assert.equal(randulDeCopyright("© {an} Cabinet · {an}", 2031, "X"), "© 2031 Cabinet · 2031");
  assert.equal(randulDeCopyright("© {AN} Cabinet", 2027, "X"), "© 2027 Cabinet");
  // Fără semn în față, „© " și anul se pun singure, iar `{an}` din mijloc tot se înlocuiește.
  assert.equal(randulDeCopyright("Cabinet, din {an}", 2026, "X"), "© 2026 Cabinet, din 2026");
  // O acoladă care nu e `{an}` nu se atinge.
  assert.equal(randulDeCopyright("© {anul} Cabinet {", 2026, "X"), "© {anul} Cabinet {");
});

test("câmpul e în Setări, opțional, cu limită, și se salvează cum e scris", () => {
  const camp = CAMPURI_CABINET.find((c) => c.cheie === "copyright");
  assert.ok(camp, "lipsește câmpul „copyright” din Setări");
  assert.equal(camp.tip, "text");
  assert.equal(camp.eticheta, "Textul de copyright din subsol");
  assert.ok(!camp.obligatoriu, "câmpul nu are voie să fie obligatoriu: gol înseamnă comportamentul de dinainte");
  assert.equal(camp.max, MAX_COPYRIGHT);
  assert.ok(/©/.test(camp.hint) && /se pun singure/.test(camp.hint), "hint-ul trebuie să spună că © și anul se pun singure");
  assert.ok(!camp.hint.includes("{an}"), "omul nu trebuie să învețe un cod: © și anul vin singure");

  const scris = { nume: "Popescu Robert", copyright: "  Cabinet Individual · CIF 54440949  " };
  const stocat = catreStocare(catreEditor(scris, CAMPURI_CABINET), CAMPURI_CABINET);
  assert.equal(stocat.copyright, "Cabinet Individual · CIF 54440949", "se salvează doar textul, fără © și fără an; se taie spațiile de la capete");

  // Reîncărcat în formular, textul e cel salvat.
  assert.equal(catreEditor(stocat, CAMPURI_CABINET).copyright, "Cabinet Individual · CIF 54440949");
});

test("câmpul golit nu lasă nicio cheie în date, deci subsolul revine la © + anul + numele", () => {
  const stocat = catreStocare(catreEditor({ nume: "Popescu Robert", copyright: "   " }, CAMPURI_CABINET), CAMPURI_CABINET);
  assert.ok(!("copyright" in stocat), JSON.stringify(stocat));
});

test("limita: 200 de caractere trec, 201 nu", () => {
  const cu = (n) => ({ nume: "Popescu Robert", copyright: "a".repeat(n) });
  assert.equal(valideaza(catreEditor(cu(MAX_COPYRIGHT), CAMPURI_CABINET), CAMPURI_CABINET).copyright, undefined);
  assert.ok(valideaza(catreEditor(cu(MAX_COPYRIGHT + 1), CAMPURI_CABINET), CAMPURI_CABINET).copyright);
});

test("subsolul de pe site, cadrul și previzualizarea din Setări folosesc aceeași regulă", () => {
  const subsol = citeste("src/components/site/footer.tsx");
  assert.ok(subsol.includes("randulDeCopyright(data.copyright, an, data.nume)"));
  assert.ok(!/©\s*\{an\}\s*\{data\.nume\}/.test(subsol), "a rămas rândul vechi, scris de mână în subsol");

  const cadru = citeste("src/components/site/cadru-site.tsx");
  assert.ok(cadru.includes("copyright: brand.copyright"), "site-ul public trebuie să paseze câmpul subsolului");

  const previzualizare = citeste("src/app/dashboard/setari/formular.tsx");
  assert.ok(previzualizare.includes('copyright: text("copyright")'), "previzualizarea din Setări trebuie să arate ce scrie omul");
});
