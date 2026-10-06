import type { TemplateAsezari } from "@/lib/templates";

/**
 * Ce mărime de poză să caute clientul, scrisă chiar în zona de încărcare.
 *
 * DE CE EXISTĂ. Panoul spunea doar „cel mult 5 MB" — nimic despre forma sau
 * mărimea pozei. Mai rău, la prima secțiune scria „merge cel mai bine una
 * pătrată sau verticală", deși la două șabloane poza de acolo e LATĂ (16:9):
 * clientul urca ce i se spusese și o vedea tăiată (prins de proprietar, 6 oct.
 * 2026). Acum fiecare loc își spune forma și mărimea, iar cele care diferă de la
 * un șablon la altul (prima secțiune, „Despre mine") o spun pe cea a șablonului
 * clientului — fără să-i pomenească numele, ca la poza de la servicii.
 *
 * CUM S-AU ALES CIFRELE. Forma e cea de pe site (aceeași ca în `rame-poze.ts`,
 * iar proba `dimensiuni-poze.proba.mjs` le compară). Mărimea „recomandată" e
 * lățimea maximă la care poza se vede pe site, înmulțită cu 2 pentru ecranele
 * dense, rotunjită. Mai sus de ~2000 px pe lățime nu câștigi nimic: optimizatorul
 * de imagini nu servește mai mult de atât. „Cel puțin" e lățimea de pe site, la
 * 1×: sub ea poza se vede moale pe orice ecran. Sunt recomandări, nu reguli —
 * nimic nu se respinge la încărcare, iar o poză cu alte proporții se taie în ramă
 * (punctul focal din previzualizare ajută).
 *
 * Se schimbă ÎMPREUNĂ cu componentele care desenează poza: lățimile vin din
 * `sizes` și din `maxWidth`-urile lor.
 */

export type LocPoza =
  | "heroLat"
  | "heroPatrat"
  | "despre"
  | "despreRotund"
  | "serviciuBanda"
  | "serviciuRotund"
  | "articol"
  | "aparitie"
  | "vitrina"
  | "program";

type Dimensiune = {
  /** Cum se vede pe site, pe scurt. */
  forma: string;
  /** Raportul ramei de pe site, ca în `raportRamei`. */
  raport: string;
  recomandat: [number, number];
  minim: [number, number];
  /** O frază în plus, unde forma singură nu ajunge. */
  nota?: string;
};

export const DIMENSIUNI_POZE: Record<LocPoza, Dimensiune> = {
  heroLat: { forma: "lată (16:9)", raport: "16 / 9", recomandat: [2000, 1125], minim: [1200, 675] },
  heroPatrat: { forma: "pătrată (1:1)", raport: "1 / 1", recomandat: [1200, 1200], minim: [700, 700] },
  despre: { forma: "verticală (4:5)", raport: "4 / 5", recomandat: [800, 1000], minim: [500, 625] },
  despreRotund: {
    forma: "rotundă, decupată dintr-un pătrat (1:1)",
    raport: "1 / 1",
    recomandat: [700, 700],
    minim: [400, 400],
  },
  serviciuBanda: { forma: "o bandă lată (16:7)", raport: "16 / 7", recomandat: [1800, 790], minim: [1000, 440] },
  // Pe prima pagină poza e un cerc, dar e ACEEAȘI poză care se vede lată pe
  // pagina serviciului — deci mărimea cerută e cea a benzii, iar nota spune ce
  // se întâmplă cu cercul.
  serviciuRotund: {
    forma: "rotundă pe prima pagină (decupată din mijloc) și o bandă lată (16:7) pe pagina serviciului",
    raport: "16 / 7",
    recomandat: [1800, 790],
    minim: [1000, 440],
    nota: "Cercul ia doar mijlocul pozei: ține subiectul în centru sau mută încadrarea din previzualizare.",
  },
  articol: { forma: "lată (16:9)", raport: "16 / 9", recomandat: [1600, 900], minim: [1000, 563] },
  aparitie: { forma: "lată (16:9)", raport: "16 / 9", recomandat: [1200, 675], minim: [800, 450] },
  vitrina: { forma: "lată (16:9)", raport: "16 / 9", recomandat: [1200, 675], minim: [800, 450] },
  program: { forma: "puțin lată (3:2)", raport: "3 / 2", recomandat: [1200, 800], minim: [800, 533] },
};

const mp = ([l, h]: [number, number]) => `${l} × ${h} px`;

/** Textul de sub „Trage o imagine aici…" pentru un loc. */
export function textDimensiuni(loc: LocPoza): string {
  const d = DIMENSIUNI_POZE[loc];
  const baza = `Pe site-ul tău poza e ${d.forma}. Recomandat: ${mp(d.recomandat)}, cel puțin ${mp(d.minim)}.`;
  return d.nota ? `${baza} ${d.nota}` : baza;
}

/**
 * Locul unei poze din secțiunile paginii principale, după secțiune și câmp —
 * aceleași condiții ca în `raportRamei`. `undefined` = un câmp pe care nu l-am
 * trecut aici: atunci nu se arată nimic, nu o presupunere.
 */
export function locPozaSectiune(
  cheieSectiune: string,
  drumCamp: string,
  context: { asezari: TemplateAsezari; variant?: string | null },
): LocPoza | undefined {
  const camp = drumCamp.replace(/\.\d+\./g, ".");
  const { asezari, variant } = context;

  if (cheieSectiune === "hero" && camp === "imagine") {
    return asezari.hero === "pozaLata" ? "heroLat" : "heroPatrat";
  }
  if (cheieSectiune === "aboutTeaser" && camp === "imagine") {
    return asezari.desprePozaRotunda ? "despreRotund" : "despre";
  }
  if (cheieSectiune === "portfolio" && camp === "elemente.imagine") {
    return variant === "vitrina" ? "vitrina" : "program";
  }
  if (cheieSectiune === "logos" && camp === "elemente.imagine") return "aparitie";

  return undefined;
}

export function dimensiuniPozaSectiune(
  cheieSectiune: string,
  drumCamp: string,
  context: { asezari: TemplateAsezari; variant?: string | null },
): string | undefined {
  const loc = locPozaSectiune(cheieSectiune, drumCamp, context);
  return loc ? textDimensiuni(loc) : undefined;
}
