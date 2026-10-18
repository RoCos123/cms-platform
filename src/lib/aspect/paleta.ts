import type { TemplatePalette } from "@/lib/templates/types";
import { contrast, hexDinOklch, oklchDinHex, type Oklch } from "./culoare";

/**
 * Paleta unui șablon, calculată dintr-o singură culoare aleasă de client.
 *
 * CE FACE. Clientul alege „culoarea principală". Din ea se scoate toată paleta, ca site-ul
 * să arate ca și cum șablonul ar fi fost desenat pentru culoarea aia: fundalurile primesc
 * o tentă din ea, fundalul închis devine o variantă foarte închisă a ei, textul — un
 * aproape-negru cu aceeași tentă, iar accentul de pe fundal închis — o variantă deschisă.
 *
 * ȘABLONUL RĂMÂNE ȘABLON. Nu se schimbă luminozitatea niciunui rol (un fundal crem rămâne
 * la fel de deschis, unul închis la fel de închis) și nici cât de colorat e fiecare față
 * de accent: „Claritate" are un alb pur și așa rămâne, „Lumină" are un fundal închis
 * violet intens și rămâne intens în orice nuanță. Se schimbă DOAR nuanța, iar cromatica
 * se scalează cu cât de vie e culoarea aleasă.
 *
 * LIZIBILITATEA E GARANTATĂ. Pe fiecare pereche text–fundal care apare pe ecran (aceleași
 * pe care le verifică `e2e/contrast-sabloane.proba.mjs`) raportul WCAG e cel puțin 4,5:1.
 * Dacă culoarea aleasă e prea deschisă ca să se citească pe fundal deschis (un galben, de
 * pildă), accentul se întunecă cât trebuie — și rezultatul spune asta (`accentAjustat`), ca
 * panoul să i-o poată explica clientului. Ce nu se poate garanta e „frumos"; ce se poate
 * garanta e „se citește".
 *
 * Funcție pură, fără „use client" și fără `server-only`: o rulează și site-ul, și
 * previzualizarea din panou, și probele din Node (sute de culori la întâmplare).
 */

/** Pragul WCAG 2.1 AA pentru text normal. Același ca în proba șabloanelor. */
export const PRAG_CONTRAST = 4.5;

/**
 * Cât țintim la calcul. Puțin peste prag: culoarea se rotunjește la 8 biți pe canal, iar
 * rotunjirea poate lua o zecime din raport. Verificarea finală se face tot pe hex.
 */
const TINTA = 4.6;

/** Cel mai mare chroma care se ia din culoarea aleasă pentru tente (peste, fundalurile ar arăta vopsite). */
const CHROMA_MAXIM_TENTA = 0.2;

/** Cât de colorat poate fi un rol, în funcție de ce e: fundal deschis, text, fundal închis. */
const PLAFON = { fundalDeschis: 0.03, relief: 0.04, text: 0.06, inchis: 0.13 } as const;

export type RezultatPaleta = {
  paleta: TemplatePalette;
  /** Culoarea exact cum a ales-o clientul. */
  culoareaAleasa: string;
  /** Accentul care ajunge pe site; diferă de cea aleasă doar dacă n-ar fi fost lizibilă. */
  accentObtinut: string;
  /** Accentul a trebuit întunecat ca textul să se poată citi? */
  accentAjustat: boolean;
};

/**
 * Aduce o culoare la raportul de contrast cerut față de TOATE fundalurile date, mișcându-i
 * doar luminozitatea (nuanța și cromatica rămân; ce nu încape în sRGB se decolorează puțin).
 * `inchide` — fundalurile sunt deschise, textul se întunecă; `deschide` — invers.
 */
function ajusteaza(
  culoare: Oklch,
  fundaluri: string[],
  directie: "inchide" | "deschide",
  tinta = TINTA,
): string {
  const trece = (l: number) => {
    const hex = hexDinOklch({ ...culoare, l });
    return fundaluri.every((fundal) => contrast(hex, fundal) >= tinta);
  };

  if (trece(culoare.l)) return hexDinOklch(culoare);

  // Contrastul crește monoton spre negru (pe fundal deschis) sau spre alb (pe fundal închis):
  // căutare binară între culoarea dorită și capătul care trece sigur.
  let sigur = directie === "inchide" ? 0 : 1;
  let dorit = culoare.l;
  for (let i = 0; i < 28; i += 1) {
    const mijloc = (sigur + dorit) / 2;
    if (trece(mijloc)) sigur = mijloc;
    else dorit = mijloc;
  }

  return hexDinOklch({ ...culoare, l: sigur });
}

/** Luminozitatea și cromatica unui rol din șablon, cu nuanța culorii alese. */
function tintata(
  hexSablon: string,
  aleasa: Oklch,
  cromaDeReferinta: number,
  plafon: number,
): Oklch {
  const rol = oklchDinHex(hexSablon);
  // Cât de colorat e rolul față de accentul șablonului. Plafonat: un rol aproape la fel de
  // colorat ca accentul n-ar trebui să urmeze culoarea aleasă până la a o egala.
  const raport = Math.min(rol.c / cromaDeReferinta, 0.9);
  return { l: rol.l, c: Math.min(raport * Math.min(aleasa.c, CHROMA_MAXIM_TENTA), plafon), h: aleasa.h };
}

/**
 * Paleta șablonului, refăcută în jurul unei culori. `culoare` e `#RRGGBB` (se verifică
 * înainte, la salvare); orice altceva ar da o paletă fără sens, deci apelantul o validează.
 */
export function paletaDinCuloare(sablon: TemplatePalette, culoare: string): RezultatPaleta {
  const aleasa = oklchDinHex(culoare);
  // Referința pentru „cât de colorat e un rol": accentul șablonului, cu un minim ca un
  // șablon cu accent aproape gri să nu împartă la ~zero.
  const referinta = Math.max(oklchDinHex(sablon.accent).c, 0.05);

  const tinteaza = (hex: string, plafon: number) => tintata(hex, aleasa, referinta, plafon);

  // 1. Fundalurile: nuanța culorii alese, luminozitatea și „cât de colorat" ale șablonului.
  const fundal = hexDinOklch(tinteaza(sablon.fundal, PLAFON.fundalDeschis));
  const fundalNuantat = hexDinOklch(tinteaza(sablon.fundalNuantat, PLAFON.fundalDeschis));
  const fundalRelief = hexDinOklch(tinteaza(sablon.fundalRelief, PLAFON.relief));
  const fundalInchis = hexDinOklch(tinteaza(sablon.fundalInchis, PLAFON.inchis));
  const chenar = hexDinOklch(tinteaza(sablon.chenar, PLAFON.relief));
  const deschise = [fundal, fundalNuantat, fundalRelief];

  // 2. Ce se scrie peste ele. Pornește de la luminozitatea din șablon și se mută doar cât
  //    trebuie ca să treacă pragul pe cel mai greu fundal.
  const text = ajusteaza(tinteaza(sablon.text, PLAFON.text), deschise, "inchide");
  const textSecundar = ajusteaza(tinteaza(sablon.textSecundar, PLAFON.text), deschise, "inchide");
  const textPeInchis = ajusteaza(tinteaza(sablon.textPeInchis, PLAFON.text), [fundalInchis], "deschide");
  const textSecundarPeInchis = ajusteaza(
    tinteaza(sablon.textSecundarPeInchis, PLAFON.text),
    [fundalInchis],
    "deschide",
  );

  // 3. Accentul = culoarea aleasă, întunecată doar dacă altfel nu s-ar citi pe fundalurile
  //    deschise (linkuri, cuvinte colorate, butonul plin).
  const accent = ajusteaza(aleasa, deschise, "inchide");

  // Textul de pe butonul plin. Alb dacă trece (accentul a fost deja adus peste 4,6:1 față de
  // fundaluri mai închise decât albul, deci cu albul trece mereu); altfel cel mai închis text.
  const accentText = [sablon.accentText, "#FFFFFF", text].find((candidat) => contrast(candidat, accent) >= TINTA)
    ?? "#FFFFFF";

  // Pe fundal închis: nuanța și cromatica culorii alese, luminozitatea rolului din șablon.
  const accentPeInchis = ajusteaza(
    { l: oklchDinHex(sablon.accentPeInchis).l, c: aleasa.c, h: aleasa.h },
    [fundalInchis],
    "deschide",
  );

  // Roșul erorilor nu urmează culoarea aleasă (o eroare verde ar fi o minciună), dar trebuie
  // să rămână lizibil pe fundalurile noi.
  const eroare = ajusteaza(oklchDinHex(sablon.eroare), deschise, "inchide");
  const eroarePeInchis = ajusteaza(oklchDinHex(sablon.eroarePeInchis), [fundalInchis], "deschide");

  const paleta: TemplatePalette = {
    fundal,
    fundalNuantat,
    fundalInchis,
    fundalRelief,
    text,
    textSecundar,
    textPeInchis,
    textSecundarPeInchis,
    accent,
    accentText,
    accentPeInchis,
    eroare,
    eroarePeInchis,
    chenar,
  };

  // Al doilea accent, cald, doar la „Apropiere": rămâne al șablonului (e identitatea lui),
  // dar ca TEXT (accentul scris de mână din titluri) trebuie să rămână citibil ca titlu mare,
  // adică măcar 3:1, pe fundalurile noi.
  if (sablon.accentCald) paleta.accentCald = sablon.accentCald;
  if (sablon.accentCaldInchis) {
    paleta.accentCaldInchis = ajusteaza(oklchDinHex(sablon.accentCaldInchis), deschise, "inchide", 3.2);
  }

  return {
    paleta,
    culoareaAleasa: culoare.toUpperCase(),
    accentObtinut: accent,
    accentAjustat: Math.abs(oklchDinHex(accent).l - aleasa.l) > 0.015,
  };
}

/** O pereche text–fundal care apare pe ecran, cu numele ei pe înțelesul clientului. */
export type PerecheContrast = {
  nume: string;
  text: string;
  fundal: string;
  minim: number;
};

const FUNDALURI_DESCHISE = [
  ["fundal", "fundalul paginii"],
  ["fundalNuantat", "fundalul secțiunilor nuanțate"],
  ["fundalRelief", "fundalul secțiunilor mai închise la culoare"],
] as const;

const TEXTE_PE_DESCHIS = [
  ["text", "Textul"],
  ["textSecundar", "Textul discret"],
  ["accent", "Culoarea principală"],
  ["eroare", "Mesajele de eroare"],
] as const;

const TEXTE_PE_INCHIS = [
  ["textPeInchis", "Textul de pe fundalul închis"],
  ["textSecundarPeInchis", "Textul discret de pe fundalul închis"],
  ["accentPeInchis", "Culoarea principală pe fundalul închis"],
  ["eroarePeInchis", "Mesajele de eroare pe fundalul închis"],
] as const;

/**
 * Perechile care chiar apar pe ecran — aceleași pe care le verifică proba de contrast a
 * șabloanelor (`e2e/contrast-sabloane.proba.mjs`), cu nume pe înțelesul unui client. Un loc
 * pentru ele: paleta calculată le garantează, iar modul manual le arată ca avertismente.
 */
export function perechiDeContrast(paleta: TemplatePalette): PerecheContrast[] {
  const lista: PerecheContrast[] = [];

  for (const [rolFundal, numeFundal] of FUNDALURI_DESCHISE) {
    for (const [rolText, numeText] of TEXTE_PE_DESCHIS) {
      lista.push({
        nume: `${numeText} pe ${numeFundal}`,
        text: paleta[rolText],
        fundal: paleta[rolFundal],
        minim: PRAG_CONTRAST,
      });
    }
  }

  lista.push({
    nume: "Textul de pe butoane, pe culoarea principală",
    text: paleta.accentText,
    fundal: paleta.accent,
    minim: PRAG_CONTRAST,
  });

  for (const [rolText, numeText] of TEXTE_PE_INCHIS) {
    lista.push({ nume: numeText, text: paleta[rolText], fundal: paleta.fundalInchis, minim: PRAG_CONTRAST });
  }

  return lista;
}

export type RezultatPereche = PerecheContrast & { raport: number; trece: boolean };

/** Perechile, cu raportul măsurat; `trece` = e măcar cât pragul perechii. */
export function verificaPerechi(paleta: TemplatePalette): RezultatPereche[] {
  return perechiDeContrast(paleta).map((pereche) => {
    const raport = contrast(pereche.text, pereche.fundal);
    return { ...pereche, raport, trece: raport >= pereche.minim };
  });
}
