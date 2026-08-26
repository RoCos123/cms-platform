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

export type TemplateId = "caldura" | "liniste" | "lumina" | "apropiere";

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
  chenar: string;
};

export type TemplateTypography = {
  /** Fontul de text curent. Numele exact din Google Fonts. */
  fontPrincipal: string;
  /** Fontul de titlu/accent. La toate patru șabloanele e un serif. */
  fontSecundar: string;
  /** Stiva de rezervă, pentru cazul în care fontul nu se încarcă. */
  fallbackPrincipal: string;
  fallbackSecundar: string;
  /** Titlurile mari folosesc fontul secundar, sau doar accentele din ele? */
  titluriInSecundar: boolean;
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
        chenar: "color-mix(in oklab, currentColor 18%, transparent)",
      };
    case "relief":
      return {
        fundal: p.fundalRelief,
        text: p.text,
        textSecundar: p.textSecundar,
        chenar: p.chenar,
      };
    case "nuantat":
      return {
        fundal: p.fundalNuantat,
        text: p.text,
        textSecundar: p.textSecundar,
        chenar: p.chenar,
      };
    default:
      return {
        fundal: p.fundal,
        text: p.text,
        textSecundar: p.textSecundar,
        chenar: p.chenar,
      };
  }
}
