import assert from "node:assert/strict";
import test from "node:test";
import { descrieIntrarea, grupeazaPeZile, oraIntrarii } from "@/lib/activitate";

/**
 * Proba jurnalului de activitate. Se rulează cu `pnpm test:logica`.
 *
 * Două lucruri se pot strica tăcut aici: acordul în română (rândul rămâne
 * lizibil, dar prost scris) și fusul orar (rândurile ajung sub ziua greșită).
 */

test("rezumatul scris de acțiune are întâietate", () => {
  // Doar acțiunea știe despre CE anume e vorba, deci textul ei bate orice
  // propoziție compusă aici.
  assert.equal(
    descrieIntrarea({
      actiune: "publish",
      entitate: "Page",
      rezumat: "Pagina „Tarife” a fost publicată.",
    }),
    "Pagina „Tarife” a fost publicată.",
  );
});

test("fără rezumat, propoziția se acordă cu genul", () => {
  // „O pagină a fost șters" e greșit, iar clientul citește rândurile astea ca
  // propoziții, nu ca log de server.
  assert.equal(
    descrieIntrarea({ actiune: "delete", entitate: "Page" }),
    "O pagină a fost ștearsă.",
  );
  assert.equal(
    descrieIntrarea({ actiune: "delete", entitate: "Service" }),
    "Un serviciu a fost șters.",
  );
  assert.equal(
    descrieIntrarea({ actiune: "create", entitate: "BlogArticle" }),
    "Un articol a fost creat.",
  );
  assert.equal(
    descrieIntrarea({ actiune: "update", entitate: "Upload" }),
    "O imagine a fost modificată.",
  );
});

test("setările sunt plural și cer verb la plural", () => {
  assert.equal(
    descrieIntrarea({ actiune: "update", entitate: "SiteSettings" }),
    "Setările au fost modificate.",
  );
});

test("un rezumat gol e ca și cum n-ar fi", () => {
  assert.equal(
    descrieIntrarea({ actiune: "update", entitate: "Page", rezumat: "   " }),
    "O pagină a fost modificată.",
  );
});

test("conectarea și deconectarea nu se descriu ca obiecte", () => {
  assert.equal(descrieIntrarea({ actiune: "login", entitate: "Session" }), "Conectare în panou.");
  assert.equal(
    descrieIntrarea({ actiune: "logout", entitate: "Session" }),
    "Deconectare din panou.",
  );
});

test("o acțiune necunoscută nu dărâmă ecranul", () => {
  // Jurnalul e ultimul loc în care vrei o eroare: el e cel care ar trebui să
  // explice ce s-a întâmplat.
  assert.equal(
    descrieIntrarea({ actiune: "arhivare", entitate: "Page" }),
    "S-a făcut o modificare.",
  );
  assert.equal(
    descrieIntrarea({ actiune: "update", entitate: "Altceva" }),
    "S-a făcut o modificare.",
  );
});

const intrare = (id, cand) => ({ id, text: "ceva", cand });

test("zilele se numesc Azi și Ieri, restul cu data", () => {
  const acum = new Date("2026-08-27T12:00:00+03:00");

  const zile = grupeazaPeZile(
    [
      intrare("a", "2026-08-27T09:30:00+03:00"),
      intrare("b", "2026-08-26T18:00:00+03:00"),
      intrare("c", "2026-08-23T10:00:00+03:00"),
    ],
    acum,
  );

  assert.deepEqual(
    zile.map((z) => z.eticheta),
    ["Azi", "Ieri", "23 august 2026"],
  );
});

test("intrările din aceeași zi stau împreună, zilele noi primele", () => {
  const acum = new Date("2026-08-27T12:00:00+03:00");

  const zile = grupeazaPeZile(
    [
      intrare("a", "2026-08-27T09:30:00+03:00"),
      intrare("b", "2026-08-23T10:00:00+03:00"),
      intrare("c", "2026-08-27T08:00:00+03:00"),
    ],
    acum,
  );

  assert.equal(zile.length, 2);
  assert.deepEqual(zile[0].intrari.map((i) => i.id), ["a", "c"]);
  assert.deepEqual(zile[1].intrari.map((i) => i.id), ["b"]);
});

test("ora târzie din România rămâne în ziua ei, nu trece în următoarea", () => {
  // Serverul rulează pe UTC. 23:30 ora României vara e 20:30 UTC — dar 00:30
  // ora României e 21:30 UTC ÎN ZIUA DE DINAINTE. Fără fus scris explicit,
  // rândurile de seară ar ajunge sub ziua de mâine.
  const acum = new Date("2026-08-27T12:00:00+03:00");

  const zile = grupeazaPeZile([intrare("seara", "2026-08-26T23:30:00+03:00")], acum);

  assert.equal(zile[0].eticheta, "Ieri");
});

test("miezul nopții proaspăt trecut e deja Azi", () => {
  const acum = new Date("2026-08-27T12:00:00+03:00");

  const zile = grupeazaPeZile([intrare("noaptea", "2026-08-27T00:20:00+03:00")], acum);

  assert.equal(zile[0].eticheta, "Azi");
});

test("ora se scrie în fusul clientului, nu în UTC", () => {
  // 06:30 UTC = 09:30 în România, vara.
  assert.equal(oraIntrarii("2026-08-27T06:30:00Z"), "09:30");
});

test("jurnalul gol nu produce nicio zi", () => {
  assert.deepEqual(grupeazaPeZile([], new Date("2026-08-27T12:00:00+03:00")), []);
});
