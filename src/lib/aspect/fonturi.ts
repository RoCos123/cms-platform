import type { TemplateTypography } from "@/lib/templates/types";

/**
 * Fonturile alese de un client pentru site-ul lui (meniul „Aspect"): unul pentru titluri și
 * unul pentru text, dintr-o listă ALEASĂ — nu „orice font din Google".
 *
 * De ce o listă închisă: fonturile se servesc de pe domeniul clientului (`next/font`, descărcate
 * la build), iar `next/font` cere fiecare font scris în cod (`src/lib/templates/fonturi.ts`).
 * Și, mai ales, fiecare font de aici a fost verificat pe fișierele adevărate (20 oct. 2026):
 * are ă, â, î, ș, ț — cu VIRGULĂ, nu cu sedilă. Trei fonturi frumoase (Marcellus, Philosopher,
 * Poiret One) au căzut tocmai aici, deși Google le declară cu `latin-ext`. Un font nou intră în
 * listă doar după aceeași verificare.
 *
 * Listele sunt cele aprobate de proprietar, după ce le-a văzut puse pe un site adevărat: prima
 * listă de titluri i s-a părut „cam asemănătoare între ele" (avea dreptate: șase serife de carte
 * din opt), așa că a doua are câte un font din fiecare stil — „pe toate le vreau".
 *
 * Stau în `site_settings.brand.aspect.fonturi` = `{ titluri, text }` (JSONB, fără migrare),
 * lângă culori. `null` la una dintre ele = cea a șablonului.
 */

/** Stivele de rezervă: ce se vede cât se încarcă fontul, apropiat ca formă de el. */
const REZERVE = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  rotunjit: "ui-rounded, ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, serif",
  deMana: "cursive",
} as const;

export type FontTitlu = {
  /** Numele exact din Google Fonts — același ca în `src/lib/templates/fonturi.ts`. */
  nume: string;
  /** Stilul, pe înțelesul clientului: așa e grupată lista în panou. */
  stil: string;
  /** Grosimea titlurilor cu fontul ăsta. A fontului, nu a șablonului: Cormorant la 700 ar fi apăsat. */
  greutate: number;
  /** Are tăietură cursivă? Fără ea, browserul ar înclina el literele drepte. */
  cursive: boolean;
  /**
   * Distanța minimă dintre rândurile unui titlu (cât `line-height`), ca diacriticele să nu se
   * atingă: virgula de sub ș/ț sau coada lui p/g de pe un rând față de căciulița lui î/â de pe
   * rândul de dedesubt. Măsurată în Chromium pe fișierele adevărate (20 oct. 2026), la grosimea
   * titlului și la a părții evidențiate, plus 0,04 aer. Doar o limită de jos: un titlu care are
   * deja mai mult spațiu nu se schimbă.
   */
  interlinie: number;
  rezerve: string;
};

export type FontText = {
  nume: string;
  descriere: string;
  rezerve: string;
};

/** Fonturile pentru titluri — câte unul din fiecare stil, în ordinea arătată proprietarului. */
export const FONTURI_TITLU: readonly FontTitlu[] = [
  // Inter e declarat fără cursive (`fonturi.ts`, ca până acum), deci „fără" aici.
  { nume: "Inter", stil: "Neutru", greutate: 700, cursive: false, interlinie: 1.08, rezerve: REZERVE.sans },
  { nume: "Josefin Sans", stil: "Geometric", greutate: 600, cursive: true, interlinie: 0.97, rezerve: REZERVE.sans },
  { nume: "Quicksand", stil: "Rotunjit, prietenos", greutate: 600, cursive: false, interlinie: 1.06, rezerve: REZERVE.rotunjit },
  { nume: "Bricolage Grotesque", stil: "Cu personalitate", greutate: 600, cursive: false, interlinie: 1.06, rezerve: REZERVE.sans },
  { nume: "Playfair Display", stil: "De revistă", greutate: 500, cursive: true, interlinie: 1.11, rezerve: REZERVE.serif },
  { nume: "Cormorant Garamond", stil: "Clasic, fin", greutate: 500, cursive: true, interlinie: 1.08, rezerve: REZERVE.serif },
  { nume: "Fraunces", stil: "Moale, cald", greutate: 500, cursive: true, interlinie: 1.03, rezerve: REZERVE.serif },
  { nume: "Zilla Slab", stil: "Solid", greutate: 600, cursive: true, interlinie: 0.97, rezerve: REZERVE.serif },
  { nume: "Tenor Sans", stil: "Sculptat, aerisit", greutate: 400, cursive: false, interlinie: 1.01, rezerve: REZERVE.sans },
  { nume: "Instrument Serif", stil: "Îngust, rafinat", greutate: 400, cursive: true, interlinie: 1.11, rezerve: REZERVE.serif },
  { nume: "Caveat", stil: "Scris de mână", greutate: 600, cursive: false, interlinie: 0.87, rezerve: REZERVE.deMana },
];

/** Fonturile pentru text. Aici e firesc să semene: toate trebuie să se citească ușor. */
export const FONTURI_TEXT: readonly FontText[] = [
  { nume: "Inter", descriere: "Fără serife, neutru", rezerve: REZERVE.sans },
  { nume: "DM Sans", descriere: "Fără serife, rotund", rezerve: REZERVE.sans },
  { nume: "Nunito", descriere: "Fără serife, prietenos", rezerve: REZERVE.rotunjit },
  { nume: "Source Sans 3", descriere: "Fără serife, compact", rezerve: REZERVE.sans },
  { nume: "Figtree", descriere: "Fără serife, cald", rezerve: REZERVE.sans },
  { nume: "Lora", descriere: "Cu serife, echilibrat", rezerve: REZERVE.serif },
  { nume: "Source Serif 4", descriere: "Cu serife, clasic", rezerve: REZERVE.serif },
  { nume: "Literata", descriere: "Cu serife, făcut pentru ecran", rezerve: REZERVE.serif },
  { nume: "Manrope", descriere: "Fără serife, modern", rezerve: REZERVE.sans },
  { nume: "Newsreader", descriere: "Cu serife, de ziar", rezerve: REZERVE.serif },
];

/**
 * Perechile gata alese (cerute de proprietar: „5 combinații sau mai multe, pe lângă alegerea
 * liberă"), pentru clientul care nu se pricepe la fonturi. Fiecare pune un titlu cu caracter
 * lângă un text care se citește ușor și nu se bate cu el.
 */
export const PERECHI_FONTURI: readonly { nume: string; titluri: string; text: string }[] = [
  { nume: "Elegant", titluri: "Cormorant Garamond", text: "DM Sans" },
  { nume: "De revistă", titluri: "Playfair Display", text: "Source Sans 3" },
  { nume: "Cald", titluri: "Fraunces", text: "Figtree" },
  { nume: "Prietenos", titluri: "Quicksand", text: "Nunito" },
  { nume: "Modern", titluri: "Bricolage Grotesque", text: "Inter" },
  { nume: "Rafinat", titluri: "Instrument Serif", text: "Inter" },
  { nume: "Retro", titluri: "Josefin Sans", text: "Lora" },
  { nume: "Aerisit", titluri: "Tenor Sans", text: "Literata" },
];

export type AspectFonturi = {
  /** Fontul titlurilor (`FONTURI_TITLU`), sau `null` = al șablonului. */
  titluri: string | null;
  /** Fontul textului (`FONTURI_TEXT`), sau `null` = al șablonului. */
  text: string | null;
};

export const fontTitlu = (nume: unknown) => FONTURI_TITLU.find((font) => font.nume === nume);
export const fontText = (nume: unknown) => FONTURI_TEXT.find((font) => font.nume === nume);

/**
 * Fonturile din bază, curățate. Un nume care nu e (sau nu mai e) în listă se ignoră în tăcere:
 * un JSON scris de mână sau un font scos din listă nu are voie să strice site-ul public. `null`
 * = niciun font propriu valabil, deci site-ul are fonturile șablonului.
 */
export function citesteAspectFonturi(brut: unknown): AspectFonturi | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const sursa = brut as Record<string, unknown>;

  const titluri = fontTitlu(sursa.titluri)?.nume ?? null;
  const text = fontText(sursa.text)?.nume ?? null;
  return titluri || text ? { titluri, text } : null;
}

/** Fonturile din `brand` (un JSONB venit din bază), ca să le citească și cadrul, și panoul. */
export function fonturiDinBrand(brand: unknown): unknown {
  if (typeof brand !== "object" || brand === null) return undefined;
  const aspect = (brand as Record<string, unknown>).aspect;
  if (typeof aspect !== "object" || aspect === null) return undefined;
  return (aspect as Record<string, unknown>).fonturi;
}

/**
 * Tipografia care ajunge pe site: a șablonului, cu fonturile alese de client.
 *
 * • TEXTUL schimbă doar fontul principal (paragrafe, meniu, butoane, formulare).
 * • TITLURILE schimbă titlurile, cuvintele colorate din ele, cifrele mari și citatele — tot ce
 *   scrie șablonul cu fontul lui secundar —, cu grosimea fontului ales. Un titlu nu ajunge
 *   astfel cu două fonturi în aceeași propoziție.
 *
 * Indiferent ce se alege, titlurile primesc un font de titlu explicit (`fontTitlu`). Pe
 * Claritate, cinci secțiuni își scriau titlul cu fontul de TEXT (n-aveau `titluSerif`): fără
 * asta, un font de text ales le-ar fi schimbat și lor titlul, iar unul de titlu nu le-ar fi
 * atins — văzut pe imaginile arătate proprietarului.
 *
 * Fără cursive (Quicksand, Bricolage, Tenor Sans, Caveat), accentele rămân drepte: altfel le-ar
 * înclina browserul, cum se ferea deja „Apropiere" cu Caveat.
 *
 * Partea evidențiată din TITLURI („în ritmul tău") se scrie cursiv la orice font ales care are
 * cursive, chiar dacă șablonul o ține dreaptă (Claritate): pe Claritate singura diferență era
 * grosimea, iar Playfair, Instrument Serif, Tenor Sans, Caveat n-au o tăietură subțire — a doua
 * parte arăta ca prima (prins de proprietar). A ales, din planșa cu variante, „doar cursiv acolo
 * unde se poate, fără culoare". Citatele și recenziile nu se schimbă: ele ascultă tot de șablon.
 */
export function tipografieEfectiva(sablon: TemplateTypography, fonturi: AspectFonturi): TemplateTypography {
  const tipografie: TemplateTypography = { ...sablon };

  // Fontul de titlu al șablonului, cu rezervele lui — luat ÎNAINTE să schimbe textul ceva.
  const titluSablon = sablon.titluriInSecundar
    ? { nume: sablon.fontSecundar, rezerve: sablon.fallbackSecundar }
    : { nume: sablon.fontPrincipal, rezerve: sablon.fallbackPrincipal };
  tipografie.fontTitlu = titluSablon.nume;
  tipografie.fallbackTitlu = titluSablon.rezerve;

  const text = fontText(fonturi.text);
  if (text) {
    tipografie.fontPrincipal = text.nume;
    tipografie.fallbackPrincipal = text.rezerve;
  }

  const titlu = fontTitlu(fonturi.titluri);
  if (titlu) {
    tipografie.fontTitlu = titlu.nume;
    tipografie.fallbackTitlu = titlu.rezerve;
    tipografie.fontSecundar = titlu.nume;
    tipografie.fallbackSecundar = titlu.rezerve;
    tipografie.titluriInSecundar = true;
    tipografie.greutateTitlu = titlu.greutate;
    tipografie.accentInItalic = sablon.accentInItalic && titlu.cursive;
    tipografie.secundarFaraCursive = !titlu.cursive;
    tipografie.accentTitluCursiv = titlu.cursive;
    // Căciulița lui î atingea rândul de deasupra (Instrument Serif, Cormorant — prins de proprietar).
    tipografie.interlinieMinimaTitlu = titlu.interlinie;
  }

  return tipografie;
}
