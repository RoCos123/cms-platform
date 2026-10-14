import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Jurnalul de activitate: tipurile din cod și regulile bazei trebuie să spună
 * același lucru. `pnpm test:logica`.
 *
 * Ce s-a întâmplat (găsit pe 14 oct. 2026, la butonul „Schimbă emailul"):
 * `EntitateAudit` din `src/lib/audit.ts` avea 12 valori, dar constrângerea
 * `audit_log_entity_type_check` din bază doar 10. „Site" (publicarea și retragerea
 * site-ului) și „DatePersonale" (ștergerea datelor unei persoane) pică la bază, iar
 * `scrieInJurnal` înghite eroarea dinadins (jurnalul nu are voie să strice o
 * modificare deja făcută) — deci acele intrări nu au apărut niciodată în
 * „Activitate", fără ca vreun ecran, vreun test sau vreun mesaj să spună asta.
 *
 * Adevărul despre bază se ia din `supabase/verificare-schema.sql`, amprenta pe
 * care CI o compară cu ce produc migrările: dacă migrarea lipsește, valoarea
 * lipsește și de acolo.
 */

const sursa = (cale) => readFileSync(cale, "utf8");

/** Valorile unui tip-uniune din `audit.ts`, fără comentarii. */
function valoriDinTip(nume) {
  const text = sursa("src/lib/audit.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const inceput = text.indexOf(`export type ${nume} =`);
  assert.ok(inceput >= 0, `tipul ${nume} a dispărut din audit.ts`);
  const corp = text.slice(inceput, text.indexOf(";", inceput));
  return [...corp.matchAll(/"(\w+)"/g)].map((m) => m[1]);
}

/** Valorile acceptate de o constrângere `CHECK (… = ANY (ARRAY[…]))` din amprentă. */
function valoriDinBaza(constrangere) {
  const linie = sursa("supabase/verificare-schema.sql")
    .split("\n")
    .find((l) => l.includes(`public.audit_log.${constrangere}`));
  assert.ok(linie, `constrângerea ${constrangere} nu mai e în amprenta schemei`);
  return [...linie.matchAll(/''(\w+)''::text/g)].map((m) => m[1]);
}

test("fiecare entitate pe care o poate scrie codul e acceptată de bază — și invers", () => {
  const cod = valoriDinTip("EntitateAudit").sort();
  const baza = valoriDinBaza("audit_log_entity_type_check").sort();

  const lipsescDinBaza = cod.filter((v) => !baza.includes(v));
  assert.deepEqual(
    lipsescDinBaza,
    [],
    `Entități pe care codul le scrie, dar baza le refuză (intrările pică tăcut): ${lipsescDinBaza.join(", ")}. ` +
      "Trebuie o migrare care lărgește `audit_log_entity_type_check`.",
  );

  const lipsescDinCod = baza.filter((v) => !cod.includes(v));
  assert.deepEqual(
    lipsescDinCod,
    [],
    `Entități acceptate de bază, dar lipsă din tipul EntitateAudit: ${lipsescDinCod.join(", ")}.`,
  );
});

test("la fel și acțiunile", () => {
  assert.deepEqual(
    valoriDinTip("ActiuneAudit").sort(),
    valoriDinBaza("audit_log_action_check").sort(),
    "ActiuneAudit și `audit_log_action_check` trebuie să rămână la fel",
  );
});

test("fiecare entitate scrisă în cod are și o etichetă în „Activitate”", () => {
  const etichete = sursa("src/lib/activitate.ts");
  const lipsa = valoriDinTip("EntitateAudit").filter((v) => !new RegExp(`\\b${v}:\\s*\\{`).test(etichete));
  // „Session” nu e scrisă de nimeni (conectările au o frază proprie); restul trebuie să aibă etichetă.
  assert.deepEqual(lipsa.filter((v) => v !== "Session"), [], "o intrare fără etichetă ar arăta doar „S-a făcut o modificare.”");
});
