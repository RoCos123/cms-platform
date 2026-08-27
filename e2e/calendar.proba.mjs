import assert from "node:assert/strict";
import test from "node:test";
import { luniDeAles, lunaZilei } from "@/lib/calendar";
import { lunaScrisa } from "@/lib/zile";

/**
 * Proba calendarului de pe pagina de programare. `pnpm test:logica`.
 *
 * Greșelile de aici sunt toate de o zi: o lună care începe duminica, februarie
 * într-un an bisect, o zi liberă căzută în coloana vecină. Niciuna nu se vede
 * uitându-te la luna curentă — de asta se probează pe luni alese anume.
 */

/** Numele lunii nu contează în probele de așezare; îl scurtăm la cheie. */
const CHEIA = (cheie) => cheie;

test("fără nicio zi liberă nu se arată niciun calendar", () => {
  assert.deepEqual(luniDeAles([], CHEIA), []);
});

test("luna care începe duminica împinge ziua 1 în ultima coloană", () => {
  // 1 februarie 2026 e duminică. Cu săptămâna începută luni, e a șaptea
  // coloană — deci șase căsuțe goale înainte. Cu getUTCDay() nemutat ar fi
  // ieșit zero, iar toată luna ar fi fost cu o zi alături.
  const [februarie] = luniDeAles(["2026-02-10"], CHEIA);
  assert.equal(februarie.gol, 6);
});

test("luna care începe luni nu are nicio căsuță goală", () => {
  const [iunie] = luniDeAles(["2026-06-10"], CHEIA);
  assert.equal(iunie.gol, 0);
});

test("februarie bisect are 29 de căsuțe", () => {
  const [februarie] = luniDeAles(["2024-02-10"], CHEIA);
  assert.equal(februarie.celule.length, 29);
  assert.equal(februarie.celule.at(-1).zi, "2024-02-29");
});

test("februarie obișnuit are 28", () => {
  const [februarie] = luniDeAles(["2026-02-10"], CHEIA);
  assert.equal(februarie.celule.length, 28);
});

test("luna se dă întreagă, nu doar zilele libere", () => {
  const [septembrie] = luniDeAles(["2026-09-14", "2026-09-17"], CHEIA);

  assert.equal(septembrie.celule.length, 30);
  assert.equal(septembrie.celule[0].zi, "2026-09-01");

  const libere = septembrie.celule.filter((c) => c.liber).map((c) => c.zi);
  assert.deepEqual(libere, ["2026-09-14", "2026-09-17"]);
});

test("zilele libere se așază la 14 și 17, nu alături", () => {
  const [septembrie] = luniDeAles(["2026-09-14"], CHEIA);
  // A paisprezecea căsuță din lună, la indexul 13. Verificarea prinde o
  // eventuală tăiere greșită a șirului de zile.
  assert.equal(septembrie.celule[13].numar, 14);
  assert.equal(septembrie.celule[13].liber, true);
  assert.equal(septembrie.celule[12].liber, false);
});

test("orizontul care trece în luna următoare dă două luni întregi", () => {
  const luni = luniDeAles(["2026-08-28", "2026-09-25"], CHEIA);

  assert.deepEqual(luni.map((l) => l.cheie), ["2026-08", "2026-09"]);
  assert.equal(luni[0].celule.length, 31);
  assert.equal(luni[1].celule.length, 30);
  // 1 august 2026 e sâmbătă: a șasea coloană.
  assert.equal(luni[0].gol, 5);
});

test("orizontul care trece în anul următor nu sare peste decembrie", () => {
  // Bucla numără lunile de mână; fără mutarea anului ar fi mers la infinit
  // sau ar fi sărit direct în ianuarie.
  const luni = luniDeAles(["2026-12-20", "2027-01-05"], CHEIA);
  assert.deepEqual(luni.map((l) => l.cheie), ["2026-12", "2027-01"]);
});

test("o singură lună când toate zilele sunt în ea", () => {
  const luni = luniDeAles(["2026-09-01", "2026-09-30"], CHEIA);
  assert.equal(luni.length, 1);
});

test("calendarul se deschide pe luna zilei alese", () => {
  const luni = luniDeAles(["2026-08-28", "2026-09-25"], CHEIA);

  assert.equal(lunaZilei(luni, "2026-08-28"), 0);
  assert.equal(lunaZilei(luni, "2026-09-25"), 1);
  // O zi din afara listei nu trebuie să dea -1, adică o lună inexistentă.
  assert.equal(lunaZilei(luni, "2030-01-01"), 0);
});

test("capul calendarului se scrie cu literă mare, în română", () => {
  assert.equal(lunaScrisa("2026-09"), "Septembrie 2026");
  assert.equal(lunaScrisa("2026-01"), "Ianuarie 2026");
});

test("capul lunii nu cade în luna dinainte", () => {
  // Se scrie din ziua 15 la prânz tocmai ca marginile să nu conteze; dacă
  // s-ar scrie din 1 la miezul nopții, un fus în urmă ar da luna anterioară.
  assert.equal(lunaScrisa("2026-03"), "Martie 2026");
  assert.equal(lunaScrisa("2026-11"), "Noiembrie 2026");
});
