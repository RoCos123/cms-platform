import { numara } from "@/lib/numerale";

/**
 * Câte articole, servicii și pagini poate avea un site — ciornele se numără și
 * ele.
 *
 * DE CE STAU AICI și nu în fișierele de acțiuni. Până pe 3 oct. 2026 fiecare
 * număr era o constantă privată în `actions.ts` al ecranului lui. Dar fișierele
 * astea sunt `"use server"`, care nu pot exporta decât funcții asincrone — deci
 * paginile de listă nu aveau de unde să afle limita, și nu puteau s-o scrie în
 * mesaj. Un număr din mesaj scris de mână ar fi ajuns, la prima schimbare de
 * limită, să mintă.
 */
export const MAXIM_ARTICOLE = 500;
export const MAXIM_SERVICII = 40;
export const MAXIM_PAGINI = 50;

/**
 * Valoarea pe care acțiunile „+ Adaugă” o pun în adresă când limita e atinsă
 * (`?eroare=prea-multe`) și pe care paginile de listă o citesc.
 *
 * O singură sursă pentru amândouă capetele. Defectul care a dus la fișierul ăsta
 * era exact o nepotrivire între ele: acțiunile trimiteau parametrul, iar nicio
 * pagină nu-l citea, deci omul apăsa „+ Adaugă” și nu se întâmpla nimic vizibil.
 */
export const EROARE_PREA_MULTE = "prea-multe";

/**
 * Mesajul pentru client. Cu pluralul corect din română („500 de articole”, nu
 * „500 articole”): `numara` știe când cere „de”.
 */
export function mesajLimita(
  maxim: number,
  singular: string,
  plural: string,
): string {
  return `Ai ajuns la limita de ${numara(maxim, singular, plural)}. Șterge unul ca să poți adăuga altul.`;
}
