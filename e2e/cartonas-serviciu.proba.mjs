import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { RANDURI_CARTONAS, serviciiPentruPrevizualizare, textCartonas } from "@/lib/servicii";

/**
 * Proba cartonașului de serviciu de pe prima pagină. `pnpm test:logica`.
 *
 * DE CE EXISTĂ. Cartonașul arăta doar PRIMUL RÂND al descrierii. O descriere
 * care începea cu „…depistarea următoarelor:" și continua cu o listă se oprea
 * în aer, la două puncte, iar clientul nu avea de unde ști, fiindcă panoul îi
 * arăta doar pagina de servicii (3 oct. 2026). Cerut de proprietar: cartonașe
 * de aceeași mărime, textul tăiat cu „Citește mai mult", și tăierea vizibilă în
 * panou cât scrie.
 */

const ser = (id, extra = {}) => ({
  id,
  slug: id,
  titlu: `Serviciu ${id}`,
  descriereScurta: "",
  descriereCompleta: `Descrierea lui ${id}.`,
  ...extra,
});

test("cartonașul ia TOATĂ descrierea, rând sub rând, nu doar primul rând", () => {
  const descriere =
    "Aplicăm diferite teste. Aceste teste sunt utile pentru depistarea următoarelor:\n\n- anxietate\n- depresie";

  assert.equal(
    textCartonas({ descriereCompleta: descriere, descriereScurta: "" }),
    "Aplicăm diferite teste. Aceste teste sunt utile pentru depistarea următoarelor:\n- anxietate\n- depresie",
  );
});

test("rândurile goale dintre paragrafe nu mănâncă din cele patru rânduri", () => {
  assert.equal(textCartonas({ descriereCompleta: "Unu.\n\n\n\nDoi.", descriereScurta: "" }), "Unu.\nDoi.");
});

test("fără descriere lungă (conținut vechi), se ia rezumatul", () => {
  assert.equal(textCartonas({ descriereCompleta: "", descriereScurta: "Rezumat vechi." }), "Rezumat vechi.");
});

test("o descriere uriașă nu ajunge întreagă în pagină, ci tăiată la un cuvânt", () => {
  const lung = "cuvânt ".repeat(1000);
  const text = textCartonas({ descriereCompleta: lung, descriereScurta: "" });

  assert.ok(text.length <= 801, `prea lung: ${text.length}`);
  assert.ok(text.endsWith("cuvânt…"), "tăiat la margine de cuvânt, cu „…”");
});

test("patru rânduri — numărul pe care l-a văzut proprietarul în capturi", () => {
  assert.equal(RANDURI_CARTONAS, 4);
});

test("previzualizare: serviciul editat stă în locul lui, cu vecinii adevărați", () => {
  const publicate = [ser("a"), ser("b"), ser("c")];
  const editat = ser("b", { titlu: "Nou" });
  const { servicii, motiv } = serviciiPentruPrevizualizare(publicate, editat, undefined);

  assert.deepEqual(servicii.map((s) => s.titlu), ["Serviciu a", "Nou", "Serviciu c"]);
  assert.equal(motiv, null);
});

test("previzualizare: dincolo de „câte se văd”, ia locul ultimului vizibil (același număr de cartonașe)", () => {
  const publicate = [ser("a"), ser("b"), ser("c")];
  const { servicii, motiv } = serviciiPentruPrevizualizare(publicate, ser("c", { titlu: "Nou" }), 2);

  assert.deepEqual(servicii.map((s) => s.titlu), ["Serviciu a", "Nou"]);
  assert.equal(motiv, "dincoloDeNumar");
});

test("previzualizare: o ciornă apare totuși, ca să se vadă cum va arăta", () => {
  const publicate = [ser("a"), ser("b")];

  const cuLoc = serviciiPentruPrevizualizare(publicate, ser("x"), undefined);
  assert.deepEqual(cuLoc.servicii.map((s) => s.id), ["a", "b", "x"]);
  assert.equal(cuLoc.motiv, "ciorna");

  const faraLoc = serviciiPentruPrevizualizare(publicate, ser("x"), 2);
  assert.deepEqual(faraLoc.servicii.map((s) => s.id), ["a", "x"]);
});

test("toate cele patru așezări de pe prima pagină folosesc textul tăiat și cartonașe egale", () => {
  const sursa = readFileSync("src/components/site/sections/features.tsx", "utf8");

  // Nicio așezare nu mai arată doar primul rând.
  assert.doesNotMatch(sursa, /\{serviciu\.descriereScurta\}/);
  assert.equal(sursa.match(/<TextCartonas/g)?.length, 4, "cartonașe, linie, Apropiere, Liniște");
  // Rânduri egale în cele trei grile de cartonașe (linia nu are cartonașe).
  assert.equal(sursa.match(/gridAutoRows: "1fr"/g)?.length, 3);
  assert.match(sursa, /WebkitLineClamp: RANDURI_CARTONAS/);
});

test("editorul serviciului arată prima pagină, cu aceeași componentă ca site-ul", () => {
  const editor = readFileSync("src/app/dashboard/servicii/[id]/editor.tsx", "utf8");

  assert.match(editor, /<Features/);
  assert.match(editor, /useState<"primaPagina" \| "paginaServicii">\("primaPagina"\)/, "implicit: prima pagină");
  assert.match(editor, /friendly=\{template\.asezari\.serviciiFriendly\}/);
  assert.match(editor, /imagine=\{template\.asezari\.serviciiImagine\}/);
});
