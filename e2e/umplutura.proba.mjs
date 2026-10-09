import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contineUmplutura, esteUmplutura, umpluturaInHtml } from "@/lib/umplutura";
import { SECTIUNI } from "@/app/proba-vanzari/continut";

/**
 * Proba regulii din 9 oct. 2026 (brief 1.2): textul de umplutură între paranteze
 * drepte nu ajunge pe niciun site public. `pnpm test:logica`.
 *
 * Ce apără: secțiunea „Păreri" de pe sitepsihologi.ro a stat publică cu trei
 * instrucțiuni de șablon în loc de păreri („[Aici vine părerea unui client
 * adevărat…]", „[Numele] · [Cabinetul, orașul]").
 */

test("o instrucțiune întreagă între paranteze drepte e umplutură", () => {
  assert.equal(esteUmplutura("[Numele]"), true);
  assert.equal(esteUmplutura("  [Cabinetul, orașul]  "), true);
  assert.equal(esteUmplutura("[Aici vine părerea unui client adevărat — două-trei rânduri.]"), true);
  assert.equal(esteUmplutura("[CÂTE LUNI]"), true);
});

test("paranteze puse de client în frază, goale sau cu cifre nu sunt umplutură", () => {
  assert.equal(esteUmplutura("Ședința [online] durează o oră"), false);
  assert.equal(esteUmplutura("[Numele] și restul frazei"), false);
  assert.equal(esteUmplutura("Vezi nota de la sfârșit [Anexa 2]"), false);
  assert.equal(esteUmplutura("[ ]"), false);
  assert.equal(esteUmplutura("[1]"), false);
  assert.equal(esteUmplutura("[]"), false);
  assert.equal(esteUmplutura(""), false);
});

test("umplutura se găsește oriunde în conținutul secțiunii", () => {
  assert.equal(contineUmplutura({ titlu: "Păreri", marturii: [{ text: "Bun.", autor: "[Numele]" }] }), true);
  assert.equal(contineUmplutura([[["[Adâncă]"]]]), true);
  assert.equal(contineUmplutura({ titlu: "Păreri", marturii: [{ text: "Bun.", autor: "Ana" }] }), false);
  for (const gol of [null, undefined, 3, true, {}, []]) assert.equal(contineUmplutura(gol), false);
});

test("pe pagina de vânzare, doar „Păreri” are umplutură — restul secțiunilor rămân", () => {
  const cuUmplutura = SECTIUNI.filter((s) => contineUmplutura(s.data)).map((s) => s.key);
  assert.deepEqual(cuUmplutura, ["testimonials"]);
});

test("verificarea HTML prinde umplutura din textul vizibil", () => {
  const html = `<html><head><title>Site</title>
    <script type="application/ld+json">{"sameAs":["https://a.ro"],"x":["[Nu e text]"]}</script>
    <style>a[href]{color:red}</style></head>
    <body><p>[Aici vine părerea unui client adevărat]</p>
    <p class="autor">[Numele] · [Cabinetul, orașul]</p>
    <p>Ședința [online] durează o oră.</p></body></html>`;

  assert.deepEqual(umpluturaInHtml(html), [
    "[Aici vine părerea unui client adevărat]",
    "[Numele]",
    "[Cabinetul, orașul]",
  ]);
  assert.deepEqual(umpluturaInHtml("<p>Totul e scris de om.</p>"), []);
});

test("prima pagină publică scoate secțiunile cu umplutură ÎNAINTE de datele structurate", () => {
  const pagina = readFileSync("src/app/page.tsx", "utf8");
  const filtru = pagina.indexOf(".filter((rand) => !contineUmplutura(rand.data))");
  assert.ok(filtru > 0, "src/app/page.tsx nu mai filtrează secțiunile cu umplutură");
  assert.ok(filtru < pagina.indexOf("const intrebari"), "filtrul trebuie să vină înaintea întrebărilor (JSON-LD)");
});

test("meniul, subsolul și linkul „Prețuri” nu duc la o secțiune ascunsă pentru umplutură", () => {
  const vizibile = readFileSync("src/lib/sectiuni-vizibile.ts", "utf8");
  assert.equal(vizibile.split("contineUmplutura(").length - 1, 2, "ambele citiri trebuie să aplice regula");
});

test("panoul spune de ce o secțiune vizibilă lipsește de pe site", () => {
  const lista = readFileSync("src/app/dashboard/sectiuni/page.tsx", "utf8");
  assert.ok(lista.includes("umplutura: contineUmplutura(rand.data)"), "lista de secțiuni nu mai marchează umplutura");
  const editor = readFileSync("src/app/dashboard/sectiuni/[id]/editor.tsx", "utf8");
  assert.ok(editor.includes("contineUmplutura(datePreviz)"), "editorul nu mai avertizează");
});
