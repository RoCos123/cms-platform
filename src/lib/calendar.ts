/**
 * Zilele libere, aranjate ca într-un calendar.
 *
 * Prima variantă a paginii de programare punea zilele una după alta, ca un
 * șir de butoane: „28 august 2026”, „29 august 2026”, „31 august 2026”… La
 * treizeci de zile ieșea un zid de text din care nu se înțelegea nici în ce zi
 * a săptămânii cade fiecare, nici că 30 august lipsește fiindcă e duminică.
 * Un calendar spune amândouă lucrurile fără să scrie nimic în plus.
 *
 * Rupt de componentă ca să poată fi probat: aici se ascund greșelile de o zi
 * (luna care începe într-o duminică, februarie într-un an bisect), iar ele nu
 * se văd decât dacă te uiți la luna potrivită.
 */

/** O căsuță din grilă: o zi a lunii, liberă sau nu. */
export type CelulaCalendar = {
  /** „2026-09-14” — cum se compară și cum se trimite spre server. */
  zi: string;
  /** Numărul scris în căsuță. */
  numar: number;
  /** Se poate cere o oră atunci? */
  liber: boolean;
};

/** O lună întreagă, gata de așezat în șapte coloane. */
export type LunaCalendar = {
  /** „2026-09” — cheia după care se ține minte luna deschisă. */
  cheie: string;
  /** „Septembrie 2026” — scris pe server, în limba și fusul cabinetului. */
  nume: string;
  /** Câte căsuțe goale merg înaintea zilei de 1, ca să cadă în coloana ei. */
  gol: number;
  celule: CelulaCalendar[];
};

/**
 * Ziua săptămânii a unei date din calendar, 0 = luni … 6 = duminică.
 *
 * Se socotește în UTC dinadins. Întrebarea de aici nu e „la ce moment din timp
 * începe ziua asta” — aia depinde de fus — ci „în ce zi a săptămânii cade data
 * asta”, iar răspunsul e același oriunde pe glob. UTC e singurul fel de a
 * întreba fără să se strecoare un fus în calcul; cu ora locală, o dată
 * construită la miezul nopții poate cădea cu o zi înapoi.
 */
function coloanaZilei(an: number, luna: number, zi: number): number {
  // getUTCDay dă 0 = duminică; noi începem săptămâna luni, ca în România.
  return (new Date(Date.UTC(an, luna - 1, zi)).getUTCDay() + 6) % 7;
}

/** Câte zile are luna. Ziua 0 din luna următoare e ultima din asta. */
function zileleLunii(an: number, luna: number): number {
  return new Date(Date.UTC(an, luna, 0)).getUTCDate();
}

/** „2026-09-14” → [2026, 9, 14]. */
function bucati(zi: string): [number, number, number] {
  const [an, luna, numar] = zi.split("-").map(Number);
  return [an, luna, numar];
}

/**
 * Lunile de arătat, de la prima zi liberă până la ultima.
 *
 * Se dau lunile ÎNTREGI, nu doar zilele libere: o grilă din care lipsesc
 * zilele ocupate n-ar mai fi un calendar, ci tot un șir. Zilele fără ore
 * rămân scrise, doar că stinse — omul vede că nu se poate marți, nu că marți
 * a dispărut.
 *
 * `numeleLunii` vine din afară fiindcă formatarea cere `Intl` cu fusul
 * cabinetului, iar modulul ăsta nu trebuie să știe de fusuri.
 */
export function luniDeAles(
  zileLibere: string[],
  numeleLunii: (cheie: string) => string,
): LunaCalendar[] {
  if (zileLibere.length === 0) return [];

  const libere = new Set(zileLibere);
  const sortate = [...zileLibere].sort();
  const [anPrim, lunaPrima] = bucati(sortate[0]);
  const [anUltim, lunaUltima] = bucati(sortate[sortate.length - 1]);

  const luni: LunaCalendar[] = [];

  for (
    let an = anPrim, luna = lunaPrima;
    an < anUltim || (an === anUltim && luna <= lunaUltima);
    luna === 12 ? ((an += 1), (luna = 1)) : (luna += 1)
  ) {
    const cheie = `${an}-${String(luna).padStart(2, "0")}`;
    const celule: CelulaCalendar[] = [];

    for (let numar = 1; numar <= zileleLunii(an, luna); numar += 1) {
      const zi = `${cheie}-${String(numar).padStart(2, "0")}`;
      celule.push({ zi, numar, liber: libere.has(zi) });
    }

    luni.push({ cheie, nume: numeleLunii(cheie), gol: coloanaZilei(an, luna, 1), celule });
  }

  return luni;
}

/** În ce lună din listă cade ziua dată. Zero dacă n-o găsește nicăieri. */
export function lunaZilei(luni: LunaCalendar[], zi: string): number {
  const gasita = luni.findIndex((luna) => luna.cheie === zi.slice(0, 7));
  return gasita === -1 ? 0 : gasita;
}

/** Capetele săptămânii, luni întâi. Două litere: „M” singur ar fi și marți, și miercuri. */
export const CAPETE_SAPTAMANA = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"] as const;
