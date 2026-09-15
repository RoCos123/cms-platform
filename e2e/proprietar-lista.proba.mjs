import assert from "node:assert/strict";
import test from "node:test";
import {
  MARIME_PAGINA,
  parseStatus,
  curataCautarea,
  parsePagina,
  intervalul,
  numarPagini,
  filtruCautare,
} from "@/lib/proprietar-lista";

/**
 * Proba listei din panoul proprietarului (paginare/căutare/filtru). `pnpm test:logica`.
 * Partea care contează cel mai mult: căutarea nu poate sparge filtrul PostgREST.
 */

test("parseStatus acceptă doar valorile știute", () => {
  assert.equal(parseStatus("publicat"), "publicat");
  assert.equal(parseStatus("draft"), "draft");
  assert.equal(parseStatus(undefined), "toate");
  assert.equal(parseStatus("suspendat"), "toate"); // nu există în date
  assert.equal(parseStatus("'; drop"), "toate");
});

test("parsePagina forțează un întreg ≥ 1", () => {
  assert.equal(parsePagina("3"), 3);
  assert.equal(parsePagina(undefined), 1);
  assert.equal(parsePagina("0"), 1);
  assert.equal(parsePagina("-2"), 1);
  assert.equal(parsePagina("2.5"), 1);
  assert.equal(parsePagina("abc"), 1);
});

test("intervalul calculează range-ul 0-indexat", () => {
  assert.deepEqual(intervalul(1, 25), { de: 0, la: 24 });
  assert.deepEqual(intervalul(2, 25), { de: 25, la: 49 });
  assert.deepEqual(intervalul(4, 10), { de: 30, la: 39 });
});

test("numarPagini rotunjește în sus și nu coboară sub 1", () => {
  assert.equal(numarPagini(0, 25), 1);
  assert.equal(numarPagini(25, 25), 1);
  assert.equal(numarPagini(26, 25), 2);
  assert.equal(numarPagini(51, 25), 3);
});

test("curataCautarea păstrează un domeniu/email firesc", () => {
  assert.equal(curataCautarea("lumina.ro"), "lumina.ro");
  assert.equal(curataCautarea("  Cabinet   Lumină  "), "Cabinet Lumină");
  assert.equal(curataCautarea("ana@exemplu.ro"), "ana@exemplu.ro");
  assert.equal(curataCautarea("test-lumina_1"), "test-lumina_1");
  assert.equal(curataCautarea(undefined), "");
});

test("curataCautarea scoate caracterele cu rol în filtru", () => {
  // virgule, paranteze, wildcarduri LIKE, ghilimele, backslash — toate afară
  assert.equal(curataCautarea("a,b(c)d"), "a b c d");
  assert.equal(curataCautarea("100%"), "100");
  assert.equal(curataCautarea('x").or("y'), "x .or y");
  assert.ok(!curataCautarea("id.in.(1,2)").includes(","));
  assert.ok(!/[(),%*\\"'`]/.test(curataCautarea("(%*),\"'`\\")));
});

test("un q ostil nu poate strecura structură în filtrul .or()", () => {
  // Cazul de care ne temem: cineva scrie o injecție în căsuța de căutare.
  const ostil = 'x),id.in.(00000000-0000-0000-0000-000000000000';
  const filtru = filtruCautare(curataCautarea(ostil));
  // După curățare, în filtru nu mai există nici virgulă „liberă", nici paranteză
  // din partea utilizatorului: doar cele două condiții pe care le punem noi.
  assert.equal(filtru, "domain.ilike.%x id.in. 00000000-0000-0000-0000-000000000000%,name.ilike.%x id.in. 00000000-0000-0000-0000-000000000000%");
});

test("filtruCautare: fără q → null; cu id-uri de email → adaugă id.in", () => {
  assert.equal(filtruCautare(""), null);
  assert.equal(filtruCautare("lumina"), "domain.ilike.%lumina%,name.ilike.%lumina%");
  assert.equal(
    filtruCautare("ana", ["11111111-1111-1111-1111-111111111111"]),
    "domain.ilike.%ana%,name.ilike.%ana%,id.in.(11111111-1111-1111-1111-111111111111)",
  );
});

test("MARIME_PAGINA e un întreg pozitiv rezonabil", () => {
  assert.ok(Number.isInteger(MARIME_PAGINA) && MARIME_PAGINA > 0 && MARIME_PAGINA <= 100);
});
