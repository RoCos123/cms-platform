/**
 * Ce rămâne deschis pe un site care încă nu a fost publicat.
 *
 * Ruptă din `src/proxy.ts` ca să poată fi probată. Nu e o simplificare de dragul
 * curățeniei: dacă lista asta greșește într-o parte, clientul rămâne închis
 * afară din propriul panou și nu-și mai poate publica site-ul fără să sune pe
 * cineva; dacă greșește în cealaltă, un site nescris ajunge public. Amândouă
 * sunt tăcute — nimic nu pare stricat.
 */

import { estePanou, esteConectare, esteResetareParola } from "@/lib/rute";

/**
 * Căile care se servesc normal chiar și pe un site nepublicat, oricine ar cere.
 *
 * Fiecare cu motivul ei:
 *
 * - `/login` și tot `/dashboard`: fără ele s-ar închide singura ușă pe care
 *   clientul poate intra ca să scrie și, la capăt, să publice.
 * - paginile de resetare a parolei: un client care și-a uitat parola pe un site
 *   încă nepublicat trebuie să și-o poată reseta — altfel rămâne închis afară
 *   tocmai în perioada în care intră cel mai des ca să-și scrie site-ul. Iar
 *   cererea și linkul din email vin FĂRĂ sesiune, deci nu-l apără verificarea
 *   „ești proprietarul?".
 * - `/robots.txt` și `/sitemap.xml`: sunt fișiere, nu pagini. Rescrise la o
 *   pagină de HTML, un motor de căutare ar primi gunoi în loc de un refuz
 *   limpede. Ele citesc antetul și răspund singure că nu e nimic de indexat.
 *
 * Restul — prima pagină, articolele, serviciile, programările — se ascund.
 */
export function seServesteNepublicat(cale: string): boolean {
  return (
    esteConectare(cale) ||
    esteResetareParola(cale) ||
    estePanou(cale) ||
    cale === "/robots.txt" ||
    cale === "/sitemap.xml"
  );
}
