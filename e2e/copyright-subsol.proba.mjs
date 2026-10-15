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
 * denumirea întreagă și CIF-ul. Acum are un câmp în Setări.
 *
 * Ce apără:
 * 1. CÂMPUL GOL = comportamentul de dinainte. Toate site-urile existente nu au câmpul;
 *    dacă „gol" ar însemna altceva, subsolul lor s-ar schimba fără ca cineva să fi cerut;
 * 2. textul scris apare EXACT, doar cu `{an}` înlocuit — nu se adaugă nimic dinainte;
 * 3. câmpul se salvează, se reîncarcă și are o limită, ca orice câmp din Setări;
 * 4. subsolul de pe site și previzualizarea din Setări citesc același câmp, prin aceeași regulă.
 */

const citeste = (cale) => readFileSync(cale, "utf8");

test("fără text scris, rândul rămâne cel de până acum: © + anul + numele", () => {
  for (const gol of [undefined, null, "", "   ", "\n\t", 7, {}, []]) {
    assert.equal(randulDeCopyright(gol, 2026, "Popescu Robert"), "© 2026 Popescu Robert", JSON.stringify(gol));
  }
});

test("cu text scris, rândul arată exact textul, fără nimic adăugat", () => {
  const text = "© 2026 Cabinet Individual de Psihologie Popescu Cosmin Robert · CIF 54440949";
  assert.equal(randulDeCopyright(text, 2027, "Popescu Robert"), text, "un an scris ca număr rămâne cum e");
  assert.equal(randulDeCopyright("  Toate drepturile rezervate.  ", 2026, "Popescu Robert"), "Toate drepturile rezervate.");
  // Nici numele, nici anul nu se adaugă singure când omul a scris propriul rând.
  assert.ok(!randulDeCopyright("Fără nimic altceva", 2026, "Popescu Robert").includes("Popescu"));
});

test("{an} devine anul curent — oriunde, de câte ori apare, cu litere mari sau mici", () => {
  assert.equal(randulDeCopyright("© {an} Cabinet · CIF 54440949", 2026, "X"), "© 2026 Cabinet · CIF 54440949");
  assert.equal(randulDeCopyright("© {an} Cabinet · {an}", 2031, "X"), "© 2031 Cabinet · 2031");
  assert.equal(randulDeCopyright("© {AN} Cabinet", 2027, "X"), "© 2027 Cabinet");
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
  assert.ok(camp.hint.includes("{an}"), "hint-ul trebuie să spună că {an} devine anul");

  const scris = { nume: "Popescu Robert", copyright: "  © {an} Cabinet Individual · CIF 54440949  " };
  const stocat = catreStocare(catreEditor(scris, CAMPURI_CABINET), CAMPURI_CABINET);
  assert.equal(stocat.copyright, "© {an} Cabinet Individual · CIF 54440949", "se taie spațiile de la capete, nimic mai mult");

  // Reîncărcat în formular, textul e cel salvat.
  assert.equal(catreEditor(stocat, CAMPURI_CABINET).copyright, "© {an} Cabinet Individual · CIF 54440949");
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
