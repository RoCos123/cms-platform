import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { listTemplates } from "@/lib/templates";

/**
 * Șabloanele din cod și lista din SQL trebuie să spună același lucru.
 *
 * `creeaza_client` refuză un șablon pe care nu-l cunoaște — bine, altfel o
 * greșeală de scriere („linste" în loc de „liniste") ar trece în tăcere și
 * clientul ar primi alt aspect decât i s-a arătat. Dar lista aia e scrisă de
 * mână în SQL, iar un șablon nou adăugat doar în cod devine imposibil de
 * provizionat — cu un mesaj care spune că nu există, deși există.
 *
 * Proba caută ultima migrare care redefinește funcția și verifică lista din ea.
 */

const MIGRARI = path.join(process.cwd(), "supabase", "migrations");

/** Toate listele de șabloane din migrări, oriunde ar sta. */
function listeleDinSql() {
  const fisiere = readdirSync(MIGRARI).filter((n) => n.endsWith(".sql")).sort();
  const gasite = [];

  for (const nume of [...fisiere].reverse()) {
    const text = readFileSync(path.join(MIGRARI, nume), "utf8");

    for (const [unde, tipar] of [
      ["verificarea din creeaza_client", /p_sablon not in \(([^)]*)\)/],
      ["mesajul de eroare al funcției", /Cele existente: ([^.']*)\./],
      ["constrângerea din tabel", /check \(template in \(([^)]*)\)\)/],
    ]) {
      const gasit = text.match(tipar);
      if (gasit && !gasite.some((g) => g.unde === unde)) {
        gasite.push({
          unde,
          fisier: nume,
          sabloane: unde.startsWith("mesajul")
            ? gasit[1].split(",").map((s) => s.trim())
            : [...gasit[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
        });
      }
    }
  }

  return gasite;
}

test("toate cele trei liste din SQL spun ce spune codul", () => {
  /*
   * TREI locuri, nu unul. Descoperit rulând, nu citind: funcția accepta
   * `claritate`, dar `insert`-ul pica pe o constrângere scrisă în altă migrare,
   * cu două săptămâni înainte. Iar mesajul de eroare al funcției e scris
   * separat de lista pe care o verifică, deci putea minte fără să strice nimic
   * — până când cineva greșea un nume și primea o listă falsă de variante.
   */
  const liste = listeleDinSql();
  const dinCod = listTemplates().map((s) => s.id).sort();

  assert.equal(liste.length, 3, `găsite ${liste.length} liste din 3: ${liste.map((l) => l.unde)}`);

  for (const lista of liste) {
    assert.deepEqual(
      [...lista.sabloane].sort(),
      dinCod,
      `${lista.unde} (${lista.fisier}) cunoaște [${[...lista.sabloane].sort()}], ` +
        `iar codul are [${dinCod}].`,
    );
  }
});
