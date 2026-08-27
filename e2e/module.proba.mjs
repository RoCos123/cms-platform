import assert from "node:assert/strict";
import test from "node:test";
import { moduleleSiteului } from "@/lib/module";

/**
 * Proba modulelor plătite. Se rulează cu `pnpm test:logica`.
 *
 * Regula pe care o apără: implicit OPRIT. Un modul care se vinde nu are voie să
 * apară pornit din lipsă de valoare — asta ar însemna să-l dăm gratis tuturor
 * clienților de dinaintea coloanei.
 */

test("un client fără nimic scris nu are modulul", () => {
  assert.equal(moduleleSiteului({}).programari, false);
  assert.equal(moduleleSiteului(null).programari, false);
  assert.equal(moduleleSiteului(undefined).programari, false);
});

test("o valoare lipsă sau nulă înseamnă tot oprit", () => {
  // Clienții existenți dinaintea coloanei au null până rulează migrarea.
  assert.equal(moduleleSiteului({ appointments_enabled: null }).programari, false);
  assert.equal(moduleleSiteului({ appointments_enabled: undefined }).programari, false);
});

test("doar `true` adevărat pornește modulul", () => {
  assert.equal(moduleleSiteului({ appointments_enabled: true }).programari, true);
  assert.equal(moduleleSiteului({ appointments_enabled: false }).programari, false);
});
