/**
 * Un șablon = tot ce diferă vizual între cele patru site-uri furnizate de client,
 * strâns într-un singur obiect (vezi design/sabloane/README.md).
 *
 * Regula care ține sistemul ieftin: componentele de secțiune NU cunosc culori.
 * Ele cer roluri („fundalul tonului închis", „culoarea de accent"), iar șablonul
 * spune ce înseamnă fiecare rol. Un șablon nou = un fișier de valori, nu o
 * rescriere a celor 21 de secțiuni.
 */

/** Rolul de fundal al unei secțiuni în ritmul paginii, nu o culoare anume. */
export type SectionTone = "deschis" | "nuantat" | "relief" | "inchis";

export type TemplateId = "caldura" | "liniste" | "lumina" | "apropiere" | "claritate";

export type TemplatePalette = {
  /** Fundalul paginii și al secțiunilor „deschis". */
  fundal: string;
  /** Fundalul secțiunilor „nuantat" — o treaptă față de fundalul principal. */
  fundalNuantat: string;
  /** Fundalul secțiunilor „inchis" — inversiunea, pentru accente de ritm. */
  fundalInchis: string;
  /** Fundalul tonului „relief" — o treaptă mai apăsată decât „nuantat". */
  fundalRelief: string;

  text: string;
  textSecundar: string;
  /** Textul pe fundal închis — nu e mereu doar „fundalul" inversat. */
  textPeInchis: string;
  textSecundarPeInchis: string;

  accent: string;
  accentText: string;
  /**
   * Accentul pe fundal închis. Nu e un lux: un accent ales să fie lizibil pe
   * crem e aproape sigur prea închis pe maro-închis. Fără rolul ăsta, cifrele
   * pașilor și ghilimelele mari de pe benzile închise ies sub pragul WCAG.
   */
  accentPeInchis: string;
  /**
   * Accentul CALD — piersica din „Apropiere". Un al doilea accent, pe lângă
   * verde: sursa prietenoasă trage o dungă piersică sub cuvântul scris de mână
   * din titlu. Verdele (`accent`) n-ar merge acolo — ar fi două verzuri lipite.
   * Opțional: doar „Apropiere" îl are; fără el, sublinierea cade pe `accent`.
   */
  accentCald?: string;
  /** Culoarea erorilor de formular, pe fundal deschis și pe fundal închis. */
  eroare: string;
  eroarePeInchis: string;
  chenar: string;
};

export type TemplateTypography = {
  /** Fontul de text curent. Numele exact din catalogul Google Fonts — de unde
   * se descarcă la build și se servește de la noi (vezi `fonturi.ts`). */
  fontPrincipal: string;
  /** Fontul de titlu/accent. La toate patru șabloanele e un serif. */
  fontSecundar: string;
  /** Stiva de rezervă, pentru cazul în care fontul nu se încarcă. */
  fallbackPrincipal: string;
  fallbackSecundar: string;
  /**
   * Titlurile mari folosesc fontul secundar, sau doar accentele din ele?
   *
   * Ajunge la componente ca `--t-font-titlu`. Câmpul exista de la început, dar
   * nu-l citea nimeni — titlurile erau mereu în fontul principal, indiferent de
   * șablon. S-a văzut abia când „Liniște" a ieșit cu titluri sans, deși
   * originalul lui le are integral în serif. Cea mai vizibilă diferență dintre
   * cele patru, ratată de un câmp mort.
   */
  titluriInSecundar: boolean;
  /**
   * Greutatea titlurilor mari. Merge împreună cu cea de sus și nu se poate
   * deduce din ea: un serif de titlu vrea 400 (Cormorant la „Liniște" și
   * „Lumină"), iar un sans vrea gros — 700 la „Căldură", 800 la „Apropiere".
   * Măsurate pe surse.
   */
  greutateTitlu: number;
  /**
   * Bucata accentuată se scrie în cursivă?
   *
   * Nu e o preferință, e o constrângere a fontului: „Caveat", fontul de scris
   * al lui „Apropiere", n-are tăietură cursivă. Cerută oricum, browserul o
   * fabrică înclinând literele — pe un font deja scris de mână iese strâmb, iar
   * defectul se vede doar dacă te uiți la pagina randată.
   *
   * Ajunge la componente ca `--t-stil-accent`, nu ca `if` prin zece fișiere.
   */
  accentInItalic: boolean;
};

/**
 * Cum e așezată prima secțiune. Măsurat pe cele patru șabloane-sursă
 * (design/sabloane/README.md, „Așezarea, măsurată"):
 *
 * - `titluLat` — titlul ocupă TOATĂ lățimea, iar sub el vine poza la stânga cu
 *   textul la dreapta. Doar „Căldură" face asta.
 * - `textPozaDreapta` — text stânga, poză dreapta, pe două coloane. „Liniște",
 *   „Lumină" și „Apropiere" fac toate trei același lucru.
 *
 * E singura secțiune din 21 unde așezarea chiar diferă între șabloane. Restul
 * (grile de cartonașe, benzi, formulare) ies identice la măsurare, iar
 * diferența o fac culorile, fonturile și rotunjimile.
 */
export type AsezareHero = "titluLat" | "textPozaDreapta";

export type TemplateAsezari = {
  hero: AsezareHero;
  /**
   * Poza din „Despre mine" tăiată în cerc, nu în ramă verticală. Doar
   * „Claritate" o cere — restul șabloanelor păstrează portretul dreptunghiular.
   * Lipsă → dreptunghi, ca înainte.
   */
  desprePozaRotunda?: boolean;
  /**
   * Poza din „Despre mine" așezată peste un card colorat decalat („stivuită"),
   * tiparul jucăuș din „Apropiere". Doar acolo — restul rămân cu poza simplă.
   */
  desprePozaStivuita?: boolean;
  /**
   * Poza din prima secțiune fără arcada din cap — un dreptunghi rotunjit simplu.
   * Doar „Apropiere" (după model); celelalte cu poza lângă titlu păstrează
   * arcada cerută pe 16 sept.
   */
  heroFaraArcada?: boolean;
  /**
   * Cuvântul scris de mână din titlul primei secțiuni are o subliniere piersică
   * trasă pe sub el, ca la modelul prietenos. Doar „Apropiere" — la celelalte
   * accentul e serif înclinat, iar o dungă piersică sub el ar arăta lipită.
   */
  heroAccentSubliniat?: boolean;
};

export type TemplateShape = {
  /** Rotunjirea cardurilor și a imaginilor. */
  raza: string;
  /** Rotunjirea butoanelor — la toate patru sunt pastile sau aproape. */
  razaButon: string;
  /** Spațierea verticală dintre secțiuni. Densitatea e o parte din identitate. */
  spatiereSectiune: string;
};

export type Template = {
  id: TemplateId;
  /** Numele arătat clientului la alegerea șablonului. */
  nume: string;
  descriere: string;
  paleta: TemplatePalette;
  tipografie: TemplateTypography;
  forme: TemplateShape;
  /**
   * Așezările, hotărâte de șablon, nu de client (decizie 28 aug. 2026). De-aia
   * stau aici, lângă paletă și fonturi, și nu în `site_content.variant`: un
   * șablon nou rămâne un fișier de valori, fără date per client și fără
   * migrare.
   */
  asezari: TemplateAsezari;
};

/** Culoarea de fundal și de text pentru un ton dat, într-un șablon dat. */
export function tonuri(template: Template, tone: SectionTone) {
  const p = template.paleta;

  switch (tone) {
    case "inchis":
      return {
        fundal: p.fundalInchis,
        text: p.textPeInchis,
        textSecundar: p.textSecundarPeInchis,
        accent: p.accentPeInchis,
        eroare: p.eroarePeInchis,
        chenar: "color-mix(in oklab, currentColor 18%, transparent)",
      };
    case "relief":
      return {
        fundal: p.fundalRelief,
        text: p.text,
        textSecundar: p.textSecundar,
        accent: p.accent,
        eroare: p.eroare,
        chenar: p.chenar,
      };
    case "nuantat":
      return {
        fundal: p.fundalNuantat,
        text: p.text,
        textSecundar: p.textSecundar,
        accent: p.accent,
        eroare: p.eroare,
        chenar: p.chenar,
      };
    default:
      return {
        fundal: p.fundal,
        text: p.text,
        textSecundar: p.textSecundar,
        accent: p.accent,
        eroare: p.eroare,
        chenar: p.chenar,
      };
  }
}
