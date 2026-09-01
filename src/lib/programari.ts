import { momentLa, ziuaLa, ziuaSaptamanii, cuZileInUrma } from "@/lib/zile";

/**
 * Programul de lucru și orele libere care ies din el.
 *
 * Rupt de bază ca să poată fi probat fără Supabase. Aici e partea în care se
 * poate greși tăcut: o oră liberă calculată greșit înseamnă un om care se
 * prezintă la cabinet degeaba.
 */

/** Un interval din zi, pe ceasul cabinetului: „10:00” → „18:00”. */
export type Interval = { de: string; pana: string };

/**
 * Programul, așa cum stă în `site_settings.programari`.
 *
 * Zilele sunt cheiate cu „1”…„7”, luni…duminică — nu cu 0…6 ca în JavaScript,
 * unde 0 e duminica. Cine se uită în baza de date citește un număr, iar „1 =
 * luni" e ce se așteaptă un om.
 */
export type Program = {
  durataMinute: number;
  pauzaMinute: number;
  /** Cu cât timp înainte, cel puțin, se poate cere o oră. */
  preavizOre: number;
  /** Cât de departe în viitor se poate cere. */
  orizontZile: number;
  zile: Record<string, Interval[]>;
};

/**
 * Programul unui cabinet care n-a completat nimic.
 *
 * Gol, nu „luni-vineri 10-18”. Un program implicit ar însemna ore pe care
 * clientul nu le-a promis niciodată, oferite public în numele lui — aceeași
 * regulă ca la modulele plătite: ce nu s-a spus, nu se presupune.
 */
export const PROGRAM_GOL: Program = {
  durataMinute: 50,
  pauzaMinute: 10,
  preavizOre: 24,
  orizontZile: 30,
  zile: {},
};

/** Citirea din bază, cu valori de rezervă pentru orice lipsește sau e stricat. */
export function citesteProgramul(brut: unknown): Program {
  const sursa = (brut ?? {}) as Partial<Program>;
  const numar = (valoare: unknown, rezerva: number, minim: number, maxim: number) => {
    const n = Number(valoare);
    return Number.isFinite(n) && n >= minim && n <= maxim ? Math.round(n) : rezerva;
  };

  const zile: Record<string, Interval[]> = {};
  for (const zi of ["1", "2", "3", "4", "5", "6", "7"]) {
    const intervale = (sursa.zile as Record<string, unknown> | undefined)?.[zi];
    if (!Array.isArray(intervale)) continue;

    const bune = intervale.filter(
      (i): i is Interval =>
        Boolean(i) && esteOraValida((i as Interval).de) && esteOraValida((i as Interval).pana) &&
        (i as Interval).de < (i as Interval).pana,
    );
    if (bune.length > 0) zile[zi] = bune;
  }

  return {
    durataMinute: numar(sursa.durataMinute, 50, 5, 480),
    pauzaMinute: numar(sursa.pauzaMinute, 10, 0, 240),
    preavizOre: numar(sursa.preavizOre, 24, 0, 720),
    orizontZile: numar(sursa.orizontZile, 30, 1, 180),
    zile,
  };
}

/** „10:00” da, „25:00” sau „10:0” nu. */
export function esteOraValida(ora: unknown): boolean {
  return typeof ora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(ora);
}

/** Cabinetul primește programări? Fără niciun interval, formularul public nici nu apare. */
export function primesteProgramari(program: Program): boolean {
  return Object.values(program.zile).some((intervale) => intervale.length > 0);
}

/** Minutele de la miezul nopții, pentru „10:30” → 630. */
function inMinute(ora: string): number {
  const [h, m] = ora.split(":").map(Number);
  return h * 60 + m;
}

function caOra(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export type ZiCuOre = { zi: string; ore: string[] };

/**
 * Orele libere, grupate pe zile.
 *
 * `ocupate` sunt momentele de început ale programărilor vii (cerute și
 * confirmate). O oră se elimină dacă se SUPRAPUNE cu una ocupată, nu doar dacă
 * începe fix atunci: cu ședințe de 50 de minute și pas de o oră asta ar fi
 * același lucru, dar la o durată schimbată din panou n-ar mai fi, iar clientul
 * ar primi doi oameni deodată fără să înțeleagă de ce.
 *
 * `acum` se dă din afară ca să poată fi probat fără să depindă de ceas.
 */
export function oreLibere(program: Program, ocupate: Date[], acum: Date): ZiCuOre[] {
  if (!primesteProgramari(program)) return [];

  const pas = program.durataMinute + program.pauzaMinute;
  const celMaiDevreme = acum.getTime() + program.preavizOre * 60 * 60 * 1000;
  const durataMs = program.durataMinute * 60 * 1000;

  const ocupateMs = ocupate.map((o) => o.getTime()).sort((a, b) => a - b);
  const seSuprapune = (inceput: number) =>
    ocupateMs.some((o) => inceput < o + durataMs && inceput + durataMs > o);

  const rezultat: ZiCuOre[] = [];

  for (let i = 0; i < program.orizontZile; i++) {
    // `cuZileInUrma` cu număr negativ merge înainte în timp; ziua se ia mereu
    // prin `ziuaLa`, ca decalajul de fus să nu mute niciodată data.
    const ziuaCurenta = ziuaLa(cuZileInUrma(acum, -i));
    const intervale = program.zile[String(ziuaSaptamanii(momentLa(ziuaCurenta, "12:00")))] ?? [];

    const ore: string[] = [];

    for (const interval of intervale) {
      const inceputZi = inMinute(interval.de);
      const sfarsitZi = inMinute(interval.pana);

      // Ultima ședință trebuie să se TERMINE până la ora de închidere, nu doar
      // să înceapă înainte: altfel un cabinet care lucrează până la 18:00 ar
      // oferi o ședință la 17:50.
      for (let m = inceputZi; m + program.durataMinute <= sfarsitZi; m += pas) {
        const moment = momentLa(ziuaCurenta, caOra(m)).getTime();
        if (moment < celMaiDevreme) continue;
        if (seSuprapune(moment)) continue;
        ore.push(caOra(m));
      }
    }

    if (ore.length > 0) rezultat.push({ zi: ziuaCurenta, ore: [...new Set(ore)].sort() });
  }

  return rezultat;
}

/**
 * Ora cerută e chiar una dintre cele oferite?
 *
 * Se verifică pe server la fiecare cerere, nu doar când se desenează
 * formularul: între momentul în care cineva deschide pagina și cel în care
 * apasă butonul, ora poate fi luată de altcineva — sau poate fi trimisă de mână
 * o oră care n-a fost oferită niciodată.
 */
export function oraEsteLibera(
  program: Program,
  ocupate: Date[],
  acum: Date,
  cerut: Date,
): boolean {
  const zi = ziuaLa(cerut);
  const libere = oreLibere(program, ocupate, acum).find((z) => z.zi === zi);
  if (!libere) return false;

  return libere.ore.some((ora) => momentLa(zi, ora).getTime() === cerut.getTime());
}

/**
 * Motivele dintre care alege cineva care cere o oră.
 *
 * Listă închisă, aceeași pentru toți clienții platformei. Înainte, câmpul se
 * umplea din serviciile publicate ale cabinetului — un cabinet cu opt servicii
 * dădea o listă de opt, iar omul trebuia să se hotărască ce fel de ședință
 * vrea înainte să fi vorbit cu cineva. Hotărât de proprietar pe 27 aug. 2026.
 *
 * Stă aici, nu în formular, fiindcă o citește și acțiunea de server: câmpul e
 * o listă cu două intrări, deci o valoare din afara ei nu vine de la un om
 * care apasă, ci de la o cerere scrisă de mână — iar ce scrie acolo ar ajunge
 * neverificat în panoul psihologului.
 */
export const MOTIVE = ["Evaluări psihologice", "Altceva"] as const;

/** Motivul, dacă e unul dintre cele oferite. Altfel nimic — câmpul e opțional. */
export function motivValid(brut: string): string | null {
  return (MOTIVE as readonly string[]).includes(brut) ? brut : null;
}

/**
 * Ce lipsește din datele de contact ale unei cereri de programare.
 *
 * Două formulare trimit către aceeași acțiune, cu reguli diferite:
 *
 * - pe `/programare` se cere emailul, iar telefonul e în plus;
 * - în secțiunea de pe prima pagină nu există câmp de email, iar acolo
 *   telefonul e singura cale de răspuns, deci se cere el.
 *
 * Regula care le leagă e una singură: **fiecare cerere pleacă cu măcar o cale
 * prin care psihologul poate răspunde.** Ce e cerut se și scrie lângă câmp, în
 * formularul care îl arată — o etichetă „obligatoriu” pe care serverul n-o
 * susține, sau invers, e un fel de minciună care se descoperă abia la trimitere.
 *
 * `areCampEmail` vine din `formData.has("email")`, nu din valoarea lui: câmpul
 * gol și câmpul lipsă sunt lucruri diferite. O cerere scrisă de mână care sare
 * peste câmp obține exact ce obține și cineva care folosește formularul scurt —
 * adică i se cere telefonul — deci n-are ce câștiga din asta.
 *
 * Rupt de acțiune ca să poată fi probat: acțiunea cere un tenant rezolvat și o
 * bază, iar regula asta e ce se uită prima când se mai adaugă un formular.
 */
export function eroriDeContact(
  areCampEmail: boolean,
  email: string,
  telefon: string,
  emailPareValid: (email: string) => boolean,
): Record<string, string> {
  const erori: Record<string, string> = {};

  if (areCampEmail) {
    if (!email) erori.email = "Lasă o adresă de email.";
    else if (!emailPareValid(email)) erori.email = "Adresa de email nu pare completă.";
  } else if (!telefon) {
    erori.telefon = "Lasă un număr de telefon, ca să poți fi sunat.";
  }

  // Un email scris greșit rămâne greșit și acolo unde nu era cerut.
  if (!areCampEmail && email && !emailPareValid(email)) {
    erori.email = "Adresa de email nu pare completă.";
  }

  return erori;
}

/**
 * Câte cereri acceptă un cabinet într-o oră.
 *
 * Un cabinet real primește una-două pe zi. Zece într-o oră e deja mult peste
 * orice tipar omenesc, dar destul de sus cât să nu lovească niciodată pe cineva
 * adevărat — nici măcar în ziua în care psihologul apare la televizor.
 */
export const CERERI_PE_ORA = 10;

/**
 * Câte ore poate ține rezervate aceeași persoană deodată.
 *
 * UNA. Regulă a proprietarului, stabilită pe 31 aug. 2026: „o persoană să poată
 * rezerva doar un singur slot din calendar, atât.”
 *
 * Adică: până când psihologul răspunde la cererea trimisă — o confirmă sau o
 * refuză — de la același număr de telefon nu mai intră alta. După ce a
 * răspuns, omul poate cere din nou; plafonul numără doar cererile care
 * așteaptă, nu istoricul.
 *
 * Nu se coboară și nu se urcă fără ca proprietarul s-o ceară. Am ridicat-o o
 * dată la cinci, de capul meu, și a trebuit dată înapoi.
 */
export const CERERI_IN_ASTEPTARE_PER_PERSOANA = 1;

/**
 * Ce oprește o cerere de programare, dacă o oprește ceva.
 *
 * DE CE EXISTĂ. Formularul de contact avea de mult un plafon; programările,
 * niciunul. Adică oricine putea cere, una după alta, toate orele libere ale
 * unui cabinet pe o lună înainte — fiecare cerere blocând ora până când
 * psihologul o refuza de mână. Nu e furt de date, e sabotaj, și e ieftin de
 * făcut. Găsit la trecerea în revistă a riscurilor, 28 aug. 2026.
 *
 * DOUĂ PLAFOANE, fiindcă opresc lucruri diferite:
 *
 * - cel pe oră mărginește VOLUMUL — cineva care dă înainte fără să se
 *   oprească;
 * - cel pe persoană ține regula proprietarului: o persoană, un singur slot
 *   rezervat deodată. Prinde totodată omul care apasă de două ori fiindcă nu e
 *   sigur că a mers. NU e o apărare împotriva sabotajului: telefonul nu e
 *   verificat, deci se ocolește scriind alt număr — de aia sabotajul e oprit de
 *   plafonul pe oră, care nu se poate ocoli.
 *
 * NU există plafon pe totalul cererilor nerezolvate ale unui cabinet, deși ar
 * fi fost ușor de pus. Ar fi pedepsit pacienți adevărați pentru neatenția
 * psihologului: cât timp nu pleacă niciun email, un cabinet poate strânge zece
 * cereri necitite într-o săptămână fără ca nimeni să fie de vină. Un plafon
 * acolo ar fi închis ușa unor oameni reali.
 *
 * Rupt de acțiune ca să poată fi probat: pragurile sunt o judecată, iar o
 * judecată scrisă doar în cod se schimbă într-o zi fără să observe nimeni.
 */
export function opresteCererea(
  cereriUltimaOra: number,
  inAsteptareDeLaAcelasiNumar: number,
): string | null {
  if (inAsteptareDeLaAcelasiNumar >= CERERI_IN_ASTEPTARE_PER_PERSOANA) {
    return "Ai deja o oră rezervată care așteaptă confirmarea. Așteaptă răspunsul sau sună direct la cabinet.";
  }

  if (cereriUltimaOra >= CERERI_PE_ORA) {
    return "Au venit multe cereri în ultima oră. Încearcă mai târziu sau sună direct la cabinet.";
  }

  return null;
}
