/**
 * Ce scrie în banda cu servicii.
 *
 * Banda a pornit ca „auto-conținut": derula titlurile serviciilor publicate și
 * nu avea câmpuri proprii. De pe 14 oct. 2026 poate avea și cuvinte ale ei —
 * „Traumă", „Anxietate", „Dezvoltare personală" —, pentru clientul care vrea în
 * bandă altceva decât numele serviciilor (acelea rămân, cu descrierea lor, la
 * Servicii).
 *
 * REGULA: dacă lista proprie are măcar un cuvânt, banda arată DOAR cuvintele ei;
 * dacă n-are niciunul, banda arată titlurile serviciilor, exact ca înainte.
 * „Lista goală" e deci starea tuturor site-urilor de până acum — de aceea n-a
 * trebuit nicio migrare.
 *
 * Fișier neutru (nici „use client", nici `server-only`), ca limitele să se poată
 * citi și din descrierea secțiunii (panou), și din randare, și din probe.
 */

/** Cât de multe cuvinte; mai multe nu aduc nimic într-o bandă care derulează. */
export const MAX_CUVINTE_BANDA = 12;

/** Cât de lung poate fi un cuvânt (o expresie scurtă, nu o frază). */
export const MAX_LUNGIME_CUVANT_BANDA = 40;

/**
 * Cuvintele din bandă, în ordine. `cuvinte` vine din JSON-ul din bază, turnat cu
 * `as` — deci poate fi orice, nu doar un vector de șiruri. Ce nu e text, sau e
 * text gol, dispare.
 */
export function numeleDinBanda(cuvinte: unknown, servicii: readonly { titlu?: string }[]): string[] {
  const proprii = (Array.isArray(cuvinte) ? cuvinte : [])
    .filter((cuvant): cuvant is string => typeof cuvant === "string")
    .map((cuvant) => cuvant.trim())
    .filter((cuvant) => cuvant !== "");

  if (proprii.length > 0) return proprii;

  return servicii.map((serviciu) => serviciu.titlu?.trim() ?? "").filter((titlu) => titlu !== "");
}
