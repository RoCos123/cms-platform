import assert from "node:assert/strict";
import test from "node:test";
import { decalajulFusului, momentLa, oraLocala, ziuaLa, ziuaSaptamanii } from "@/lib/zile";

/**
 * Proba fusului. Se rulează cu `pnpm test:logica`.
 *
 * Aici se ascunde genul de defect care se vede o dată pe an și strică ziua
 * cuiva: o programare mutată cu o oră în săptămâna în care se dă ceasul.
 * România trece la ora de vară în ultima duminică din martie și înapoi în
 * ultima duminică din octombrie.
 */

test("vara decalajul e de trei ore, iarna de două", () => {
  assert.equal(decalajulFusului(new Date("2026-07-15T12:00:00Z")), 180);
  assert.equal(decalajulFusului(new Date("2026-12-15T12:00:00Z")), 120);
});

test("ora de pe ceasul cabinetului, nu cea UTC", () => {
  // 07:00 UTC = 10:00 vara, 09:00 iarna.
  assert.equal(oraLocala(new Date("2026-07-15T07:00:00Z")), "10:00");
  assert.equal(oraLocala(new Date("2026-12-15T07:00:00Z")), "09:00");
});

test("„luni la 10” înseamnă alt moment vara decât iarna", () => {
  // Ăsta e miezul: aceeași oră scrisă, alt moment absolut.
  assert.equal(momentLa("2026-07-15", "10:00").toISOString(), "2026-07-15T07:00:00.000Z");
  assert.equal(momentLa("2026-12-15", "10:00").toISOString(), "2026-12-15T08:00:00.000Z");
});

test("în ziua în care se dă ceasul înainte, orele de după rămân corecte", () => {
  // 29 martie 2026: la 03:00 ceasul sare la 04:00. O ședință de la 10:00 în
  // ziua aia e la 07:00 UTC, nu la 08:00.
  assert.equal(momentLa("2026-03-29", "10:00").toISOString(), "2026-03-29T07:00:00.000Z");
  // Iar cu o zi înainte, aceeași oră scrisă e alt moment.
  assert.equal(momentLa("2026-03-28", "10:00").toISOString(), "2026-03-28T08:00:00.000Z");
});

test("în ziua în care se dă ceasul înapoi, la fel", () => {
  // 25 octombrie 2026: la 04:00 ceasul se întoarce la 03:00.
  assert.equal(momentLa("2026-10-25", "10:00").toISOString(), "2026-10-25T08:00:00.000Z");
  assert.equal(momentLa("2026-10-24", "10:00").toISOString(), "2026-10-24T07:00:00.000Z");
});

test("orele dinaintea schimbării, în chiar ziua schimbării", () => {
  /*
   * Aici e capcana, și primele mele teste treceau pe lângă ea.
   *
   * Pe 29 martie 2026, România e încă pe UTC+2 până la ora 03:00, când ceasul
   * sare la 04:00. Deci 01:00 din ziua aceea e la 23:00 UTC în ziua dinainte,
   * nu la 22:00. Un calcul dintr-o singură trecere ia decalajul de DUPĂ
   * schimbare (trei ore) și dă miezul nopții — o oră alături.
   *
   * Testat cu 10:00, cum aveam la început, nu se vede nimic: 10:00 e după
   * schimbare, deci ambele variante nimeresc.
   */
  assert.equal(momentLa("2026-03-29", "01:00").toISOString(), "2026-03-28T23:00:00.000Z");
  assert.equal(momentLa("2026-03-29", "02:00").toISOString(), "2026-03-29T00:00:00.000Z");

  // Toamna, pe dos: pe 25 octombrie se e încă pe UTC+3 până la 04:00.
  assert.equal(momentLa("2026-10-25", "01:00").toISOString(), "2026-10-24T22:00:00.000Z");
  assert.equal(momentLa("2026-10-25", "02:00").toISOString(), "2026-10-24T23:00:00.000Z");
});

test("dus-întors: ora scrisă se citește înapoi neschimbată", () => {
  for (const [zi, ora] of [
    ["2026-03-29", "10:00"], ["2026-10-25", "10:00"],
    ["2026-01-05", "08:30"], ["2026-07-20", "18:45"],
  ]) {
    const moment = momentLa(zi, ora);
    assert.equal(oraLocala(moment), ora, `${zi} ${ora}`);
    assert.equal(ziuaLa(moment), zi, `${zi} ${ora}`);
  }
});

test("ziua săptămânii e cea din România, nu din UTC", () => {
  // Luni 27 iulie 2026, ora 00:30 în România = duminică 21:30 UTC.
  assert.equal(ziuaSaptamanii(new Date("2026-07-26T21:30:00Z")), 1);
  assert.equal(ziuaSaptamanii(momentLa("2026-07-26", "12:00")), 7);
});
