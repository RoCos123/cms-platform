import assert from "node:assert/strict";
import test from "node:test";
import { estePanouProprietar, DISALLOW_ROBOTS } from "@/lib/rute";
import { ADRESE_REZERVATE } from "@/lib/pagini";

/**
 * Proba panoului de proprietar. `pnpm test:logica`.
 *
 * Aceeași grijă ca la `rute.proba.mjs`: calea se recunoaște pe SEGMENTE, nu pe
 * litere, ca `/proprietarul-meu` (o pagină pe care clientul și-o poate face) să
 * nu fie luată drept panoul nostru și scoasă din Google ori ascunsă sub login.
 */

test("ecranele panoului de proprietar sunt recunoscute", () => {
  assert.ok(estePanouProprietar("/proprietar"));
  assert.ok(estePanouProprietar("/proprietar/login"));
  assert.ok(estePanouProprietar("/proprietar/intra"));
});

test("o pagină a clientului care începe la fel NU e panou de proprietar", () => {
  for (const cale of ["/proprietarul-meu", "/proprietar-2024", "/proprietari"]) {
    assert.equal(estePanouProprietar(cale), false, `nu e panou de proprietar: ${cale}`);
  }
});

test("„proprietar” e adresă rezervată — clientul nu și-o poate lua", () => {
  assert.ok(
    ADRESE_REZERVATE.includes("proprietar"),
    "altfel un client ar putea avea o pagină „proprietar” pe care ruta noastră o ascunde",
  );
});

test("robots.txt ascunde panoul de proprietar, dar nu paginile clientului", () => {
  // Există o intrare care acoperă /proprietar și ce e sub el…
  const acopera = DISALLOW_ROBOTS.some((i) => {
    const tipar = i.endsWith("$") ? i.slice(0, -1) : i;
    return "/proprietar".startsWith(tipar) || "/proprietar/ceva".startsWith(tipar);
  });
  assert.ok(acopera, "robots.txt ar trebui să oprească /proprietar");

  // …dar niciuna nu prinde /proprietarul-meu, pagina clientului.
  const paginaClient = "/proprietarul-meu";
  for (const i of DISALLOW_ROBOTS) {
    const tipar = i.endsWith("$") ? i.slice(0, -1) : i;
    const seLoveste = i.endsWith("$") ? paginaClient === tipar : paginaClient.startsWith(tipar);
    assert.equal(seLoveste, false, `„${i}” ar scoate din Google ${paginaClient}`);
  }
});
