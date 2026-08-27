/**
 * Datele și orele, în fusul clientului.
 *
 * Scrise într-un singur loc fiindcă le cer acum două ecrane — jurnalul de
 * activitate și cifrele de trafic — iar dacă fusul ar fi scris de două ori,
 * într-o zi ar rămâne unul în urmă.
 *
 * Fusul e fix, nu citit din browser: serverul rulează pe UTC, iar clienții sunt
 * cabinete din România. Fără el, tot ce se întâmplă seara ar fi socotit pe ziua
 * următoare — o vizită de la 23:30 ar apărea mâine, iar „azi" n-ar mai fi azi.
 */
export const FUSUL = "Europe/Bucharest";

const ZI_SORTABILA = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSUL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ZI_SCRISA = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FUSUL,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ZI_SCURTA = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FUSUL,
  day: "numeric",
  month: "short",
});

const ORA = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FUSUL,
  hour: "2-digit",
  minute: "2-digit",
});

/** „2026-08-27" — forma în care se compară și se stochează o zi. */
export function ziuaLa(moment: Date): string {
  return ZI_SORTABILA.format(moment);
}

/** „27 august 2026" — pentru titluri de zi. */
export function ziuaScrisa(moment: Date): string {
  return ZI_SCRISA.format(moment);
}

/** „27 aug." — pentru etichetele înghesuite de sub un grafic. */
export function ziuaScurta(moment: Date): string {
  return ZI_SCURTA.format(moment);
}

/** „09:30" — ora la care s-a întâmplat ceva. */
export function oraLa(moment: Date): string {
  return ORA.format(moment);
}

/** Ziua de acum N zile, în forma sortabilă. Pentru ferestre de tipul „ultimele 30". */
export function cuZileInUrma(moment: Date, zile: number): Date {
  return new Date(moment.getTime() - zile * 24 * 60 * 60 * 1000);
}
