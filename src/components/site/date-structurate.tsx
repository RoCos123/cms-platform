/**
 * Blocul pe care îl citesc motoarele de căutare, nu vizitatorul.
 *
 * Nu randează nimic vizibil. Textul vine gata scăpat din `caJsonLd()` — vezi
 * acolo de ce contează.
 */
export function DateStructurate({ date }: { date: string | null }) {
  // Un site fără nimic de declarat nu primește un bloc gol: `{}` în pagină e
  // o afirmație („n-am nimic de spus despre mine”), nu o absență.
  if (!date) return null;

  return (
    <script
      type="application/ld+json"
      /**
       * Singura cale de a pune JSON-LD într-o pagină: React ar scăpa `<` și `&`
       * ca text, iar motoarele de căutare ar primi entități HTML în loc de JSON.
       *
       * Ce intră aici a trecut deja prin `caJsonLd()`, care e și locul unde se
       * verifică siguranța (`e2e/date-structurate.proba.mjs`). Nu construi
       * niciodată șirul ăsta pe loc, aici.
       */
      dangerouslySetInnerHTML={{ __html: date }}
    />
  );
}
