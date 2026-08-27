import assert from "node:assert/strict";
import test from "node:test";
import {
  PROGRAM_GOL,
  citesteProgramul,
  oraEsteLibera,
  oreLibere,
  primesteProgramari,
} from "@/lib/programari";
import { momentLa } from "@/lib/zile";

/**
 * Proba programului de lucru. Se rulează cu `pnpm test:logica`.
 *
 * Miza: o oră liberă calculată greșit înseamnă un om care se prezintă la
 * cabinet degeaba, sau doi oameni în același interval.
 */

// Luni, 6 iulie 2026, ora 09:00 în România.
const ACUM = momentLa("2026-07-06", "09:00");

const PROGRAM = {
  ...PROGRAM_GOL,
  durataMinute: 50,
  pauzaMinute: 10,
  preavizOre: 24,
  orizontZile: 3,
  // Marți și miercuri, 10:00–13:00.
  zile: { "2": [{ de: "10:00", pana: "13:00" }], "3": [{ de: "10:00", pana: "13:00" }] },
};

test("un cabinet fără niciun interval nu primește programări", () => {
  assert.equal(primesteProgramari(PROGRAM_GOL), false);
  assert.deepEqual(oreLibere(PROGRAM_GOL, [], ACUM), []);
});

test("orele se generează la pas de durată plus pauză", () => {
  // 10:00, 11:00, 12:00 — a patra ar fi 13:00 și s-ar termina la 13:50.
  const marti = oreLibere(PROGRAM, [], ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00", "12:00"]);
});

test("ultima ședință trebuie să se TERMINE până la închidere", () => {
  // Un cabinet care lucrează până la 13:00 nu oferă o ședință la 12:30.
  const scurt = { ...PROGRAM, zile: { "2": [{ de: "10:00", pana: "12:30" }] } };
  const marti = oreLibere(scurt, [], ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00"]);
});

test("preavizul taie orele prea apropiate", () => {
  // ACUM e luni 09:00; cu preaviz de 24 de ore, marți înainte de 09:00 e tăiat.
  // Programul începe oricum la 10:00, deci creștem preavizul ca să se vadă.
  const cuPreavizMare = { ...PROGRAM, preavizOre: 26 };
  const marti = oreLibere(cuPreavizMare, [], ACUM).find((z) => z.zi === "2026-07-07");

  // 26 de ore de luni 09:00 = marți 11:00. 10:00 pică.
  assert.deepEqual(marti.ore, ["11:00", "12:00"]);
});

test("orizontul mărginește cât de departe se poate cere", () => {
  const zile = oreLibere(PROGRAM, [], ACUM).map((z) => z.zi);

  // Orizont de 3 zile de luni: luni, marți, miercuri. Luni n-are program.
  assert.deepEqual(zile, ["2026-07-07", "2026-07-08"]);
});

test("o oră ocupată dispare din listă", () => {
  const ocupate = [momentLa("2026-07-07", "11:00")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "12:00"]);
});

test("suprapunerea contează, nu doar începutul identic", () => {
  /*
   * Cu ședințe de 50 de minute și pas de o oră, o programare la 10:30 nu începe
   * fix la nicio oră oferită — dar se suprapune și cu 10:00, și cu 11:00. Dacă
   * s-ar compara doar începuturile, clientul ar primi doi oameni deodată.
   */
  const ocupate = [momentLa("2026-07-07", "10:30")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["12:00"]);
});

test("o programare din altă zi nu blochează nimic", () => {
  const ocupate = [momentLa("2026-07-08", "11:00")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00", "12:00"]);
});

test("zilele se leagă de ziua săptămânii, nu de poziția în listă", () => {
  // „2” e marți. Un program doar de duminică nu trebuie să apară marțea.
  const doarDuminica = { ...PROGRAM, orizontZile: 8, zile: { "7": [{ de: "10:00", pana: "12:00" }] } };
  const zile = oreLibere(doarDuminica, [], ACUM).map((z) => z.zi);

  assert.deepEqual(zile, ["2026-07-12"]); // duminica următoare
});

test("peste schimbarea orei, ședințele rămân la ora scrisă", () => {
  // Ultima duminică din octombrie 2026: ceasul dă înapoi în noaptea de sâmbătă
  // spre duminică. O ședință de luni de la 10:00 rămâne 10:00 pe ceas.
  const inainteaSchimbarii = momentLa("2026-10-23", "09:00"); // vineri
  const luni = { ...PROGRAM, orizontZile: 5, zile: { "1": [{ de: "10:00", pana: "12:00" }] } };

  const gasit = oreLibere(luni, [], inainteaSchimbarii).find((z) => z.zi === "2026-10-26");

  assert.deepEqual(gasit.ore, ["10:00", "11:00"]);
  // Și chiar e ora de iarnă: 10:00 local = 08:00 UTC.
  assert.equal(momentLa("2026-10-26", "10:00").toISOString(), "2026-10-26T08:00:00.000Z");
});

test("o oră care n-a fost oferită e respinsă", () => {
  // Cineva trimite de mână o oră din afara programului.
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "15:00")), false);
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "10:30")), false);
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "10:00")), true);
});

test("o oră luată între timp e respinsă la trimitere", () => {
  const ocupate = [momentLa("2026-07-07", "10:00")];
  assert.equal(oraEsteLibera(PROGRAM, ocupate, ACUM, momentLa("2026-07-07", "10:00")), false);
});

test("programul stricat din bază se citește cu valori de rezervă", () => {
  const citit = citesteProgramul({
    durataMinute: "nu e număr",
    orizontZile: 9999,
    zile: { "2": [{ de: "10:00", pana: "09:00" }, { de: "25:00", pana: "26:00" }, { de: "10:00", pana: "12:00" }] },
  });

  assert.equal(citit.durataMinute, 50, "cade pe valoarea implicită");
  assert.equal(citit.orizontZile, 30, "peste maxim, cade pe implicit");
  // Intervalul întors pe dos și cel cu ore inexistente se aruncă.
  assert.deepEqual(citit.zile["2"], [{ de: "10:00", pana: "12:00" }]);
});

test("un program citit din nimic e cel gol", () => {
  assert.deepEqual(citesteProgramul(null).zile, {});
  assert.equal(primesteProgramari(citesteProgramul(undefined)), false);
});
