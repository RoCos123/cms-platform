import assert from "node:assert/strict";
import test from "node:test";
import { caleaNumarata, esteRobot, rezumatulTraficului } from "@/lib/vizite";

/**
 * Proba cifrelor de trafic. Se rulează cu `pnpm test:logica`.
 *
 * Ce se poate strica tăcut aici: roboții numărați ca oameni (cifrele devin
 * minciună), aceeași pagină socotită de trei ori sub forme diferite, și zilele
 * goale sărite dintr-un grafic.
 */

test("un browser adevărat nu e robot", () => {
  assert.equal(
    esteRobot(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1",
    ),
    false,
  );
  assert.equal(
    esteRobot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"),
    false,
  );
});

test("roboții uzuali sunt prinși", () => {
  for (const ua of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23",
    "curl/8.4.0",
    "python-requests/2.31.0",
    "Chrome-Lighthouse",
  ]) {
    assert.equal(esteRobot(ua), true, `n-a prins: ${ua}`);
  }
});

test("lipsa user-agentului e semn de program, nu de om", () => {
  // Orice browser adevărat trimite unul.
  assert.equal(esteRobot(null), true);
  assert.equal(esteRobot(""), true);
  assert.equal(esteRobot("   "), true);
});

test("aceeași pagină se numără o singură dată, oricum ar fi scrisă adresa", () => {
  // Altfel clientul vede „Tarife" de trei ori, cu cifrele împărțite între ele.
  assert.equal(caleaNumarata("/tarife"), "/tarife");
  assert.equal(caleaNumarata("/Tarife"), "/tarife");
  assert.equal(caleaNumarata("/tarife/"), "/tarife");
  assert.equal(caleaNumarata("/tarife?utm_source=facebook"), "/tarife");
  assert.equal(caleaNumarata("/tarife#pret"), "/tarife");
});

test("prima pagină rămâne „/\"", () => {
  // Acolo bara ESTE calea, deci nu se taie.
  assert.equal(caleaNumarata("/"), "/");
});

test("ce nu e cale nu se numără", () => {
  assert.equal(caleaNumarata("https://alt-site.ro/pagina"), null);
  assert.equal(caleaNumarata(""), null);
});

test("o cale absurd de lungă se taie, nu umflă tabelul", () => {
  const numarata = caleaNumarata("/" + "a".repeat(500));
  assert.ok(numarata.length <= 200, `a rămas lungă: ${numarata.length}`);
});

const ACUM = new Date("2026-08-27T12:00:00+03:00");

test("zilele fără nicio vizită apar cu zero, nu lipsesc", () => {
  // Un grafic care sare peste zilele goale minte despre formă: două vârfuri la
  // o săptămână distanță ar arăta lipite.
  const rezumat = rezumatulTraficului(
    [
      { day: "2026-08-27", path: "/", views: 5 },
      { day: "2026-08-25", path: "/", views: 2 },
    ],
    ACUM,
    3,
  );

  assert.deepEqual(rezumat.perZi, [
    { zi: "2026-08-25", afisari: 2 },
    { zi: "2026-08-26", afisari: 0 },
    { zi: "2026-08-27", afisari: 5 },
  ]);
});

test("ce e mai vechi decât fereastra nu intră în total", () => {
  const rezumat = rezumatulTraficului(
    [
      { day: "2026-08-27", path: "/", views: 5 },
      { day: "2026-07-01", path: "/", views: 900 },
    ],
    ACUM,
    7,
  );

  assert.equal(rezumat.total, 5);
  assert.deepEqual(rezumat.topPagini, [{ cale: "/", afisari: 5 }]);
});

test("paginile se adună peste zile și se ordonează descrescător", () => {
  const rezumat = rezumatulTraficului(
    [
      { day: "2026-08-27", path: "/blog/anxietate", views: 4 },
      { day: "2026-08-26", path: "/blog/anxietate", views: 3 },
      { day: "2026-08-27", path: "/", views: 5 },
    ],
    ACUM,
    30,
  );

  assert.equal(rezumat.total, 12);
  assert.deepEqual(rezumat.topPagini, [
    { cale: "/blog/anxietate", afisari: 7 },
    { cale: "/", afisari: 5 },
  ]);
});

test("la egalitate ordinea e stabilă, nu se rearanjează între reîncărcări", () => {
  const randuri = [
    { day: "2026-08-27", path: "/servicii", views: 3 },
    { day: "2026-08-27", path: "/blog", views: 3 },
  ];

  assert.deepEqual(
    rezumatulTraficului(randuri, ACUM, 30).topPagini.map((p) => p.cale),
    ["/blog", "/servicii"],
  );
  assert.deepEqual(
    rezumatulTraficului([...randuri].reverse(), ACUM, 30).topPagini.map((p) => p.cale),
    ["/blog", "/servicii"],
  );
});

test("un site fără nicio vizită dă zero, nu se strică", () => {
  const rezumat = rezumatulTraficului([], ACUM, 7);

  assert.equal(rezumat.total, 0);
  assert.equal(rezumat.perZi.length, 7);
  assert.deepEqual(rezumat.topPagini, []);
});
