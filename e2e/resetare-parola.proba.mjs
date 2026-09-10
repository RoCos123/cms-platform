import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  CAI_RESETARE,
  esteResetareParola,
  esteConectare,
  DISALLOW_ROBOTS,
} from "@/lib/rute";
import { seServesteNepublicat } from "@/lib/lansare";

/**
 * Paginile de resetare a parolei trebuie să se poarte corect în trei locuri, iar
 * fiecare greșeală de aici e tăcută — pagina există, dar nu ajunge la om.
 */

test("cele trei căi de resetare sunt recunoscute ca atare", () => {
  for (const cale of CAI_RESETARE) {
    assert.ok(esteResetareParola(cale), `ar trebui recunoscută: ${cale}`);
  }
  // O pagină a clientului care seamănă NU e resetare.
  assert.equal(esteResetareParola("/parola-uitata"), false);
  assert.equal(esteResetareParola("/login/altceva"), false);
});

test("resetarea rămâne deschisă pe un site nepublicat", () => {
  // Inima probei: un client care și-a uitat parola pe un site încă nepublicat
  // trebuie să și-o poată reseta. Iar cererea și linkul vin FĂRĂ sesiune, deci
  // nu-l apără verificarea „ești proprietarul?".
  for (const cale of CAI_RESETARE) {
    assert.ok(seServesteNepublicat(cale), `trebuie servită pe nepublicat: ${cale}`);
  }
});

test("resetarea NU e tratată drept /login exact", () => {
  // Dacă ar fi, proxy-ul ar trimite la /dashboard un om care tocmai a venit pe
  // linkul de resetare (are o sesiune de recuperare) — fix înainte să-și pună
  // parola nouă.
  for (const cale of CAI_RESETARE) {
    assert.equal(esteConectare(cale), false, `nu e /login exact: ${cale}`);
  }
});

test("robots.txt ține paginile de resetare afară din căutări", () => {
  for (const cale of CAI_RESETARE) {
    const prinsa = DISALLOW_ROBOTS.some((intrare) => {
      const tipar = intrare.endsWith("$") ? intrare.slice(0, -1) : intrare;
      return cale === tipar || cale.startsWith(tipar);
    });
    assert.ok(prinsa, `robots ar trebui s-o prindă: ${cale}`);
  }
});

test("fiecare cale de resetare are un fișier de rută pe disc", () => {
  // Redenumit un folder fără să schimbi lista = o cale care nu mai există.
  const APP = path.join(process.cwd(), "src", "app");
  for (const cale of CAI_RESETARE) {
    const dir = path.join(APP, cale);
    const are =
      existsSync(path.join(dir, "page.tsx")) || existsSync(path.join(dir, "route.ts"));
    assert.ok(are, `lipsește page.tsx sau route.ts pentru ${cale}`);
  }
});
