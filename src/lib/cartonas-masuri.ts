/**
 * Măsurile cartonașului de prezentare.
 *
 * Stau separat de desen (`cartonas-og.tsx`) dintr-un motiv prozaic: Node poate
 * să ruleze direct TypeScript, dar nu și JSX, deci nimic dintr-un `.tsx` nu
 * poate fi probat cu `pnpm test:logica`. Aici e partea care chiar are ce fi
 * verificată în cifre.
 */

/** Măsura cerută de Facebook și de X pentru un cartonaș mare. */
export const MARIMEA_CARTONASULUI = { width: 1200, height: 630 };

/**
 * Cât de mare încape numele.
 *
 * „Ana Pop” și „Cabinet Individual de Psihologie Maria Ionescu” nu pot fi
 * scrise la fel: al doilea, la mărimea primului, iese din cartonaș. Praguri, nu
 * o formulă, fiindcă sunt doar trei cazuri și se citesc mai ușor așa.
 *
 * Cifrele nu sunt ghicite: cartonașul a fost desenat și privit la ambele
 * extreme — un nume de 120 de caractere (limita din `CAMPURI_CABINET`) și unul
 * de șapte. Dacă se schimbă pragurile, imaginea se privește din nou.
 */
export function marimeaNumelui(nume: string): number {
  if (nume.length > 40) return 58;
  if (nume.length > 26) return 72;
  return 88;
}
