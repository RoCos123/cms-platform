import type { TemplatePalette } from "@/lib/templates/types";
import { contrast, hexDinHsl, hexDinOklch, hslDinHex, oklchDinHex, type Hsl, type Oklch } from "./culoare";

/**
 * Paleta unui șablon, calculată dintr-o singură culoare aleasă de client.
 *
 * CE FACE. Clientul alege „culoarea principală". Din ea se scoate toată paleta, ca site-ul
 * să arate ca și cum șablonul ar fi fost desenat pentru culoarea aia.
 *
 * PALETA „PREMIUM" (19 oct. 2026, cerută de proprietar: „Premium / Quiet Luxury"). Cinci roluri
 * urmează reguli scrise de el în HSL — numere pe care le poate verifica cu orice selector:
 *
 * • `accent` (butoane, accente mari) — culoarea aleasă; dacă e foarte deschisă (L > 50%),
 *   coboară la L 28%;
 * • `fundalInchis` (benzi închise, subsol) — nuanța aleasă, S ≤ 65%, L între 11 și 15%;
 * • `accentInteractiv` (linkuri, hover pe butoane) — nuanța aleasă, S + 12% (cel mult 85%),
 *   L între 32 și 38%;
 * • `fundalNuantat` (carduri, secțiuni alternative) — nuanța aleasă, S între 10 și 16%,
 *   L între 95 și 97% (fildeș / alabastru / gheață), fără nicio transparență;
 * • `chenar` (borduri fine) — nuanța aleasă, S 15%, L 88%.
 *
 * La un gri (S < 5%) nuanța nu înseamnă nimic — HSL îi dă 0, adică roșu —, așa că griul
 * rămâne gri: saturația nu se forțează în sus (altfel un client care alege antracit pur ar
 * primi fundaluri roz).
 *
 * Restul rolurilor (fundalul paginii, fundalul de relief, textele, accentul de pe fundal
 * închis, erorile) se calculează ca înainte: luminozitatea și „cât de colorat" ale
 * șablonului, cu nuanța culorii alese (OKLCH).
 *
 * LIZIBILITATEA E GARANTATĂ ȘI CÂȘTIGĂ MEREU (hotărârea proprietarului, 19 oct.). După ce
 * fiecare rol își primește ținta din regulile de mai sus, se verifică pe fiecare pereche
 * text–fundal care apare pe ecran (aceleași pe care le verifică `contrast-sabloane.proba.mjs`,
 * plus linkurile și hover-ul) raportul WCAG de cel puțin 4,5:1. Unde ținta nu ajunge (Petrol
 * și Smarald au linkurile pe 32–38% sub prag; un galben scris de mână nu se citește deloc),
 * culoarea se întunecă exact cât trebuie. Întunecarea se face în OKLCH, nu în HSL: acolo
 * nuanța percepută rămâne aceeași (un albastru întunecat în HSL „trage" spre violet).
 * Butonul se verifică direct cu textul de pe el, nu doar cu pragul „L > 50%".
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

/** Cât de colorat poate fi un rol calculat în OKLCH: fundalul paginii, relieful, textele. */
const PLAFON = { fundalDeschis: 0.03, relief: 0.04, text: 0.06 } as const;

/** Sub atâta saturație (HSL), o culoare e gri: nuanța ei nu înseamnă nimic. */
const PRAG_GRI = 5;

/** Regulile proprietarului (HSL, procente). Un singur loc, ca probele să le citească de aici. */
export const REGULI_PREMIUM = {
  accent: { pragLuminos: 50, luminozitate: 28 },
  fundalInchis: { saturatieMaxima: 65, luminozitate: [11, 15] },
  accentInteractiv: { saturatieInPlus: 12, saturatieMaxima: 85, luminozitate: [32, 38] },
  fundalNuantat: { saturatie: [10, 16], luminozitate: [95, 97] },
  chenar: { saturatie: 15, luminozitate: 88 },
} as const;

export type RezultatPaleta = {
  paleta: TemplatePalette;
  /** Culoarea exact cum a ales-o clientul. */
  culoareaAleasa: string;
  /** Accentul care ajunge pe site; diferă de cea aleasă doar dacă n-ar fi fost lizibilă. */
  accentObtinut: string;
  /** Accentul a trebuit întunecat ca textul să se poată citi? */
  accentAjustat: boolean;
};

const intre = (valoare: number, [jos, sus]: readonly [number, number]) => Math.min(sus, Math.max(jos, valoare));

/**
 * Aduce o culoare la raportul de contrast cerut față de TOATE fundalurile date, mișcându-i
 * doar luminozitatea în OKLCH (nuanța și cromatica rămân; ce nu încape în sRGB se decolorează
 * puțin). `inchide` — fundalurile sunt deschise, culoarea se întunecă; `deschide` — invers.
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

/** Luminozitatea și cromatica unui rol din șablon, cu nuanța culorii alese (OKLCH). */
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

/** Saturația dorită de o regulă — dar un gri rămâne gri (vezi `PRAG_GRI`). */
function saturatie(aleasa: Hsl, dorita: number): number {
  return aleasa.s < PRAG_GRI ? aleasa.s : dorita;
}

/**
 * Culoarea linkurilor și a hover-ului: ținta HSL a proprietarului, apoi întunecată cât trebuie
 * ca să se citească pe toate fundalurile deschise ȘI ca textul butonului să se citească pe ea
 * (la hover, butonul ia culoarea asta). Folosită și de modul manual, pentru valoarea de pornire.
 */
export function accentInteractivDin(culoare: string, deschise: string[], textButon: string): string {
  const aleasa = hslDinHex(culoare);
  const r = REGULI_PREMIUM.accentInteractiv;
  const tinta = hexDinHsl({
    h: aleasa.h,
    s: saturatie(aleasa, Math.min(aleasa.s + r.saturatieInPlus, r.saturatieMaxima)),
    l: intre(aleasa.l, r.luminozitate),
  });
  return ajusteaza(oklchDinHex(tinta), [...deschise, textButon], "inchide");
}

/**
 * Paleta șablonului, refăcută în jurul unei culori. `culoare` e `#RRGGBB` (se verifică
 * înainte, la salvare); orice altceva ar da o paletă fără sens, deci apelantul o validează.
 */
export function paletaDinCuloare(sablon: TemplatePalette, culoare: string): RezultatPaleta {
  const aleasa = oklchDinHex(culoare);
  const hsl = hslDinHex(culoare);
  // Referința pentru „cât de colorat e un rol": accentul șablonului, cu un minim ca un
  // șablon cu accent aproape gri să nu împartă la ~zero.
  const referinta = Math.max(oklchDinHex(sablon.accent).c, 0.05);
  const tinteaza = (hex: string, plafon: number) => tintata(hex, aleasa, referinta, plafon);

  // 1. Fundalurile.
  //    Fundalul paginii și cel de relief: luminozitatea șablonului, nuanța culorii alese.
  const fundal = hexDinOklch(tinteaza(sablon.fundal, PLAFON.fundalDeschis));
  const fundalRelief = hexDinOklch(tinteaza(sablon.fundalRelief, PLAFON.relief));
  //    Fundalul nuanțat, banda închisă și chenarul: regulile premium (HSL).
  const rn = REGULI_PREMIUM.fundalNuantat;
  const fundalNuantat = hexDinHsl({
    h: hsl.h,
    s: saturatie(hsl, intre(hsl.s, rn.saturatie)),
    l: intre(hsl.l, rn.luminozitate),
  });
  const ri = REGULI_PREMIUM.fundalInchis;
  const fundalInchis = hexDinHsl({
    h: hsl.h,
    s: Math.min(hsl.s, ri.saturatieMaxima),
    l: intre(hsl.l, ri.luminozitate),
  });
  const rc = REGULI_PREMIUM.chenar;
  const chenar = hexDinHsl({ h: hsl.h, s: saturatie(hsl, rc.saturatie), l: rc.luminozitate });
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

  // 3. Accentul (butoane, accente mari). O culoare foarte deschisă coboară întâi la L 28%
  //    (regula proprietarului); apoi garda: textul ALB de pe buton trebuie să se citească pe
  //    el, iar accentul scris ca text (cuvintele colorate din titluri) pe fundalurile deschise.
  const ra = REGULI_PREMIUM.accent;
  const pornire = hsl.l > ra.pragLuminos ? hexDinHsl({ ...hsl, l: ra.luminozitate }) : culoare;
  const accent = ajusteaza(oklchDinHex(pornire), [...deschise, "#FFFFFF"], "inchide");

  // Textul de pe butonul plin: alb (garda de mai sus îl asigură); dacă șablonul are alt text
  // deschis care trece și el, îl păstrează pe al șablonului.
  const accentText = [sablon.accentText, "#FFFFFF"].find((candidat) => contrast(candidat, accent) >= TINTA)
    ?? "#FFFFFF";

  // 4. Linkurile și hover-ul pe butoane (rolul nou).
  const accentInteractiv = accentInteractivDin(culoare, deschise, accentText);

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
    accentInteractiv,
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

/**
 * De unde pornește modul manual: paleta calculată din culoarea principală, sau — dacă omul n-a
 * ales una — paleta șablonului, căreia i se adaugă doar culoarea linkurilor (șabloanele n-o au),
 * calculată din accentul șablonului. Un singur loc, ca ecranul și site-ul să pornească identic.
 */
export function bazaManuala(sablon: TemplatePalette, principala: string | null): TemplatePalette {
  if (principala) return paletaDinCuloare(sablon, principala).paleta;
  return {
    ...sablon,
    accentInteractiv: accentInteractivDin(
      sablon.accent,
      [sablon.fundal, sablon.fundalNuantat, sablon.fundalRelief],
      sablon.accentText,
    ),
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

  // Linkurile și hover-ul — doar unde există rolul (paletele calculate, nu șabloanele).
  if (paleta.accentInteractiv) {
    for (const [rolFundal, numeFundal] of FUNDALURI_DESCHISE) {
      lista.push({
        nume: `Linkurile pe ${numeFundal}`,
        text: paleta.accentInteractiv,
        fundal: paleta[rolFundal],
        minim: PRAG_CONTRAST,
      });
    }
    lista.push({
      nume: "Textul de pe butoane, când treci cu mausul peste ele",
      text: paleta.accentText,
      fundal: paleta.accentInteractiv,
      minim: PRAG_CONTRAST,
    });
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
