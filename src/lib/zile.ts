/**
 * Datele și orele, în fusul clientului.
 *
 * Scrise într-un singur loc fiindcă le cer acum două ecrane — jurnalul de
 * activitate și cifrele de trafic — iar dacă fusul ar fi scris de două ori,
 * într-o zi ar rămâne unul în urmă.
 *
 * Fusul e fix, nu citit din browser: serverul rulează pe UTC, iar clienții sunt
 * cabinete din România. Fără el, tot ce se întâmplă seara ar fi socotit pe ziua
 * următoare — o vizită de la 23:30 ar apărea mâine, iar „azi” n-ar mai fi azi.
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

/** „2026-08-27” — forma în care se compară și se stochează o zi. */
export function ziuaLa(moment: Date): string {
  return ZI_SORTABILA.format(moment);
}

/** „27 august 2026” — pentru titluri de zi. */
export function ziuaScrisa(moment: Date): string {
  return ZI_SCRISA.format(moment);
}

/** „27 aug.” — pentru etichetele înghesuite de sub un grafic. */
export function ziuaScurta(moment: Date): string {
  return ZI_SCURTA.format(moment);
}

/** „09:30” — ora la care s-a întâmplat ceva. */
export function oraLa(moment: Date): string {
  return ORA.format(moment);
}

/** Ziua de acum N zile, în forma sortabilă. Pentru ferestre de tipul „ultimele 30”. */
export function cuZileInUrma(moment: Date, zile: number): Date {
  return new Date(moment.getTime() - zile * 24 * 60 * 60 * 1000);
}

const CU_FUS = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSUL,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Cu câte minute e fusul României înaintea UTC la momentul dat.
 *
 * Nu e o constantă: vara sunt 180 de minute, iarna 120. Un program de „luni de
 * la 10" înseamnă altă oră UTC în iulie decât în decembrie, iar o programare
 * calculată cu decalajul greșit ar apărea la client cu o oră alături — exact în
 * săptămâna în care omul se prezintă degeaba.
 */
export function decalajulFusului(moment: Date): number {
  const parti = Object.fromEntries(
    CU_FUS.formatToParts(moment).map((parte) => [parte.type, parte.value]),
  );

  const caDacaArFiUTC = Date.UTC(
    Number(parti.year),
    Number(parti.month) - 1,
    Number(parti.day),
    // La miezul nopții, `hour12: false` scrie „24” în unele versiuni de ICU.
    Number(parti.hour) % 24,
    Number(parti.minute),
    Number(parti.second),
  );

  return (caDacaArFiUTC - moment.getTime()) / 60000;
}

/**
 * O zi și o oră scrise pe ceasul din România, ca moment absolut.
 *
 * „2026-08-27” + „10:00” → momentul la care ceasul de perete al cabinetului
 * arată 10:00 în ziua aceea.
 *
 * Două treceri, nu una: decalajul se calculează pentru un moment, dar momentul
 * depinde de decalaj. În zilele obișnuite a doua trecere nu schimbă nimic; în
 * cele două nopți pe an când se dă ceasul, prima trecere poate nimeri de
 * cealaltă parte a schimbării, iar a doua o corectează.
 */
export function momentLa(zi: string, ora: string): Date {
  const caUTC = Date.parse(`${zi}T${ora}:00Z`);
  const primaIncercare = new Date(caUTC - decalajulFusului(new Date(caUTC)) * 60000);

  return new Date(caUTC - decalajulFusului(primaIncercare) * 60000);
}

/** „10:00” — ora de pe ceasul din România la momentul dat. */
export function oraLocala(moment: Date): string {
  const parti = Object.fromEntries(
    CU_FUS.formatToParts(moment).map((parte) => [parte.type, parte.value]),
  );
  return `${String(Number(parti.hour) % 24).padStart(2, "0")}:${parti.minute}`;
}

/** Ziua săptămânii, 1 = luni … 7 = duminică, pe ceasul din România. */
export function ziuaSaptamanii(moment: Date): number {
  const scurt = new Intl.DateTimeFormat("en-US", { timeZone: FUSUL, weekday: "short" }).format(moment);
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[scurt] ?? 1;
}
