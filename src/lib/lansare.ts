/**
 * Ce rămâne deschis pe un site care încă nu a fost publicat.
 *
 * Ruptă din `src/proxy.ts` ca să poată fi probată. Nu e o simplificare de dragul
 * curățeniei: dacă lista asta greșește într-o parte, clientul rămâne închis
 * afară din propriul panou și nu-și mai poate publica site-ul fără să sune pe
 * cineva; dacă greșește în cealaltă, un site nescris ajunge public. Amândouă
 * sunt tăcute — nimic nu pare stricat.
 */

/**
 * Căile care se servesc normal chiar și pe un site nepublicat, oricine ar cere.
 *
 * Fiecare cu motivul ei:
 *
 * - `/login` și tot `/dashboard`: fără ele s-ar închide singura ușă pe care
 *   clientul poate intra ca să scrie și, la capăt, să publice.
 * - `/robots.txt` și `/sitemap.xml`: sunt fișiere, nu pagini. Rescrise la o
 *   pagină de HTML, un motor de căutare ar primi gunoi în loc de un refuz
 *   limpede. Ele citesc antetul și răspund singure că nu e nimic de indexat.
 *
 * Restul — prima pagină, articolele, serviciile, programările — se ascund.
 */
export function seServesteNepublicat(cale: string): boolean {
  return (
    cale === "/login" ||
    cale === "/dashboard" ||
    cale.startsWith("/dashboard/") ||
    cale === "/robots.txt" ||
    cale === "/sitemap.xml"
  );
}
