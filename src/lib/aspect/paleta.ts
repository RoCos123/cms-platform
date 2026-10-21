import type { TemplatePalette } from "@/lib/templates/types";
import { contrast, hexDinHsl, hexDinOklch, hslDinHex, oklchDinHex, type Hsl, type Oklch } from "./culoare";

/**
 * Paleta unui șablon, calculată dintr-o singură culoare aleasă de client.
 *
 * CE FACE. Clientul alege „culoarea principală". Din ea se scoate toată paleta, ca site-ul
 * să arate ca și cum șablonul ar fi fost desenat pentru culoarea aia.
 *
 * PALETA „PREMIUM" (19 oct. 2026, cerută de proprietar: „Premium / Quiet Luxury"), în două runde.
 *
 * CULOAREA STĂ PE SUPRAFEȚE MICI. Doar două roluri poartă culoarea aleasă din plin, după reguli
 * scrise de proprietar în HSL (numere pe care le poate verifica cu orice selector):
 *
 * • `accent` (butoane, accente mari) — culoarea aleasă; dacă e foarte deschisă (L > 50%),
 *   coboară la L 28%;
 * • `accentInteractiv` (linkuri, hover pe butoane) — nuanța aleasă, S + 12% (cel mult 85%),
 *   L între 32 și 38%. La un gri (S < 5%) nuanța nu înseamnă nimic — HSL îi dă 0, adică roșu —,
 *   deci griul rămâne gri.
 *
 * SUPRAFEȚELE DESCHISE SUNT CALCAR CALD, CELE ÎNCHISE MĂTASE (a treia rundă, „Silk & Velvet",
 * 19 oct. 2026). Prima rundă ieșise „verde de spital"; a doua — banda obsidian, cromă 0,025 —
 * „plată, ștearsă, fără viață". Acum, după referințele vizuale ale proprietarului:
 *
 * • fundalurile deschise: calcar cald, aceleași pentru orice culoare — pagina `#F2EFE9`, cardurile
 *   (fildeș mătăsos) `#FAF8F5`, relieful `#E8E2D5`, chenarul `#E2DDD3`;
 * • `fundalInchis` (benzi, subsol): culoarea aleasă, BOGATĂ — L 0,235 și 82% din cromă (minim
 *   0,065 la culorile cromatice; o culoare temperată, ca Eucalipt sau Espresso, rămâne temperată);
 * • MĂTASEA: banda și butoanele nu sunt un dreptunghi plat, ci un gradient la 135° — lumina (sus-
 *   stânga, 20%: L + 0,07, C + 0,02), baza (50%), umbra (jos-dreapta, 90%: L − 0,05). Gradientul
 *   stă în roluri separate (`fundalInchisMatase`, `accentMatase`), folosite DOAR ca `background`;
 *   culoarea plină rămâne pentru chenare, text și verificările de contrast;
 * • pe bandă: fildeș `#FAF6F0`, mătase crudă `#D6CFC4` și aur-șampanie `#DFC59B` (cifrele,
 *   accentele, linkurile din subsol);
 * • textele pe deschis: gri-cărbune cald (cromă 0,006).
 *
 * Unde ecranul nu are atâta culoare (un verde sau un teal foarte închis nu poate avea cromă 0,065 în
 * sRGB), croma se oprește singură la cât se poate afișa.
 *
 * LIZIBILITATEA E GARANTATĂ ȘI CÂȘTIGĂ MEREU (hotărârea proprietarului, 19 oct.). După ce
 * fiecare rol își primește ținta, se verifică pe fiecare pereche text–fundal care apare pe ecran
 * (aceleași pe care le verifică `contrast-sabloane.proba.mjs`, plus linkurile și hover-ul)
 * raportul WCAG de cel puțin 4,5:1. Unde ținta nu ajunge (Petrol și Smarald au linkurile pe
 * 32–38% sub prag; un galben scris de mână nu se citește deloc), culoarea se întunecă exact cât
 * trebuie. Întunecarea se face în OKLCH, nu în HSL: acolo nuanța percepută rămâne aceeași (un
 * albastru întunecat în HSL „trage" spre violet). Butonul se verifică direct cu textul de pe el.
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

/** Sub atâta saturație (HSL), o culoare e gri: nuanța ei nu înseamnă nimic. */
const PRAG_GRI = 5;

/**
 * Regulile proprietarului. Un singur loc, ca să se poată citi și schimba ușor. `accent` și
 * `accentInteractiv` sunt în HSL (procente); restul în OKLCH (L 0–1, C, h în grade).
 */
export const REGULI_PREMIUM = {
  accent: { pragLuminos: 50, luminozitate: 28 },
  accentInteractiv: { saturatieInPlus: 12, saturatieMaxima: 85, luminozitate: [32, 38] },
  /** Calcarul cald: aceleași pentru orice culoare aleasă (referințele proprietarului). */
  fundal: "#F2EFE9",
  fundalNuantat: "#FAF8F5",
  fundalRelief: "#E8E2D5",
  chenar: "#E2DDD3",
  /** Banda închisă: culoarea aleasă, bogată (OKLCH). */
  fundalInchis: { l: 0.235, procentCroma: 0.82, cromaMinima: 0.065, pragCromatic: 0.05 },
  /** Mătasea (OKLCH): cât urcă lumina și cât coboară umbra față de bază. */
  matase: { lumina: { l: 0.07, c: 0.02 }, umbra: { l: -0.05 } },
  /** Pe bandă: fildeș, mătase crudă, aur-șampanie. */
  textPeInchis: "#FAF6F0",
  textSecundarPeInchis: "#D6CFC4",
  accentPeInchis: "#DFC59B",
  /** Textele pe deschis: gri-cărbune cald (OKLCH, nuanța calcarului). */
  text: { croma: 0.006, h: 80 },
  /**
   * Banda „Ce spun clienții" de la Liniște (varianta B, aleasă de proprietar pe 21 oct. 2026):
   * salvia ei — măsurată pe captura proprietarului, vezi `FundalVerde` — cu lumina și croma
   * păstrate, dar în nuanța accentului și cu 0,02 mai închisă (OKLCH). Atât trebuie ca toate
   * trei textele de pe bandă să treacă 4,5:1 pe orice nuanță: fără coborâre, aurul-șampanie
   * rămânea la 4,2:1 pe partea luminoasă.
   */
  pareri: { baza: "#415447", umbra: "#3C5042", lumina: "#506456", alfaLumina: 0.55, intunecare: 0.02 },
} as const;

/** Cele trei faze ale mătăsii pentru o culoare, plus gradientul CSS gata de pus ca `background`. */
export type Matase = { lumina: string; baza: string; umbra: string; css: string };

/**
 * Mătasea unei culori: lumina (sus-stânga), baza, umbra (jos-dreapta), la 135°. Un gri rămâne gri
 * (croma nu urcă unde nuanța n-are sens).
 */
export function matase(hex: string): Matase {
  const o = oklchDinHex(hex);
  const r = REGULI_PREMIUM.matase;
  const lumina = hexDinOklch({ l: Math.min(1, o.l + r.lumina.l), c: o.c < 0.01 ? o.c : o.c + r.lumina.c, h: o.h });
  const umbra = hexDinOklch({ l: Math.max(0, o.l + r.umbra.l), c: o.c, h: o.h });
  return { lumina, baza: hex, umbra, css: `linear-gradient(135deg, ${lumina} 20%, ${hex} 50%, ${umbra} 90%)` };
}

/**
 * Fundalul benzii „Ce spun clienții": baza, umbra (dreapta), lumina largă de sus și `varf` — cel
 * mai luminos punct (lumina, la opacitatea ei, peste bază), unde se măsoară contrastul — plus
 * gradientul CSS gata de pus ca `background`.
 */
export type FundalPareri = { baza: string; umbra: string; lumina: string; varf: string; css: string };

/** Două culori `#RRGGBB` amestecate cum le amestecă ecranul: `sus` la opacitatea `alfa`, peste `jos`. */
function suprapune(sus: string, alfa: number, jos: string): string {
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const canale = [0, 1, 2].map((i) => Math.round(canal(sus, i) * alfa + canal(jos, i) * (1 - alfa)));
  return `#${canale.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/**
 * Banda „Ce spun clienții" în nuanța unui accent: un ton stins, nu culoarea plină (salvia, cu
 * nuanța schimbată). Un accent gri o dă gri — croma nu urcă unde nuanța n-are sens, ca la mătase.
 */
export function fundalPareri(accent: string): FundalPareri {
  const r = REGULI_PREMIUM.pareri;
  const nuanta = oklchDinHex(accent);
  const ton = (hex: string) => {
    const o = oklchDinHex(hex);
    return hexDinOklch({ l: o.l - r.intunecare, c: nuanta.c < 0.01 ? 0 : o.c, h: nuanta.h });
  };
  const baza = ton(r.baza);
  const umbra = ton(r.umbra);
  const lumina = ton(r.lumina);
  const alfa = Math.round(r.alfaLumina * 255).toString(16).padStart(2, "0").toUpperCase();
  return {
    baza,
    umbra,
    lumina,
    varf: suprapune(lumina, r.alfaLumina, baza),
    css: `radial-gradient(ellipse 55% 70% at 33% 0%, ${lumina}${alfa}, transparent 70%), linear-gradient(90deg, ${baza} 0%, ${baza} 50%, ${umbra} 100%)`,
  };
}

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
  /** O condiție în plus, tot monotonă (ex.: textul alb să se citească și pe lumina mătăsii). */
  siConditia: (hex: string) => boolean = () => true,
): string {
  const trece = (l: number) => {
    const hex = hexDinOklch({ ...culoare, l });
    return fundaluri.every((fundal) => contrast(hex, fundal) >= tinta) && siConditia(hex);
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
  const r = REGULI_PREMIUM;

  // 1. Fundalurile deschise: calcarul cald, același pentru orice culoare.
  const { fundal, fundalNuantat, fundalRelief, chenar } = r;
  //    Banda închisă: culoarea aleasă, bogată. O culoare cromatică păstrează cel puțin 0,065 din
  //    cromă (fără să depășească croma ei); una temperată rămâne temperată.
  const ri = r.fundalInchis;
  const cromaBanda = aleasa.c < ri.pragCromatic
    ? aleasa.c * ri.procentCroma
    : Math.max(aleasa.c * ri.procentCroma, Math.min(ri.cromaMinima, aleasa.c));
  const fundalInchis = hexDinOklch({ l: ri.l, c: cromaBanda, h: aleasa.h });
  const banda = matase(fundalInchis);
  const deschise = [fundal, fundalNuantat, fundalRelief];
  //    Ce stă pe bandă trebuie să se citească peste TOATĂ mătasea: și pe baza ei, și pe lumină.
  const peBanda = [fundalInchis, banda.lumina];

  // 2. Textele: gri-cărbune cald pe deschis (luminozitatea șablonului); fildeș și mătase crudă pe
  //    bandă — apoi garda, doar cât trebuie ca să treacă pragul pe cel mai greu fundal.
  const cald = (l: number): Oklch => ({ l, c: r.text.croma, h: r.text.h });
  const text = ajusteaza(cald(oklchDinHex(sablon.text).l), deschise, "inchide");
  const textSecundar = ajusteaza(cald(oklchDinHex(sablon.textSecundar).l), deschise, "inchide");
  const textPeInchis = ajusteaza(oklchDinHex(r.textPeInchis), peBanda, "deschide");
  const textSecundarPeInchis = ajusteaza(oklchDinHex(r.textSecundarPeInchis), peBanda, "deschide");

  // 3. Accentul (butoane, accente mari). O culoare foarte deschisă coboară întâi la L 28%
  //    (regula proprietarului); apoi garda: textul ALB de pe buton se citește pe el ȘI pe lumina
  //    mătăsii lui, iar accentul scris ca text (cuvintele colorate din titluri) pe fundalurile deschise.
  const ra = r.accent;
  const pornire = hsl.l > ra.pragLuminos ? hexDinHsl({ ...hsl, l: ra.luminozitate }) : culoare;
  const accent = ajusteaza(
    oklchDinHex(pornire),
    [...deschise, "#FFFFFF"],
    "inchide",
    TINTA,
    (hex) => contrast("#FFFFFF", matase(hex).lumina) >= TINTA,
  );
  const butonMatase = matase(accent);

  // Textul de pe butonul plin: alb (garda de mai sus îl asigură); dacă șablonul are alt text
  // deschis care trece și el, peste toată mătasea, îl păstrează pe al șablonului.
  const accentText = [sablon.accentText, "#FFFFFF"].find(
    (candidat) => contrast(candidat, accent) >= TINTA && contrast(candidat, butonMatase.lumina) >= TINTA,
  ) ?? "#FFFFFF";

  // 4. Linkurile și hover-ul pe butoane.
  const accentInteractiv = accentInteractivDin(culoare, deschise, accentText);

  // Pe bandă: aur-șampanie — nu o variantă pastelată a culorii („mentolat" pe Smarald).
  const accentPeInchis = ajusteaza(oklchDinHex(r.accentPeInchis), peBanda, "deschide");

  // Roșul erorilor nu urmează culoarea aleasă (o eroare verde ar fi o minciună), dar trebuie
  // să rămână lizibil pe fundalurile noi.
  const eroare = ajusteaza(oklchDinHex(sablon.eroare), deschise, "inchide");
  const eroarePeInchis = ajusteaza(oklchDinHex(sablon.eroarePeInchis), peBanda, "deschide");

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
    // Banda cu servicii: pe aceeași piatră caldă ca relieful, nu amestecată cu culoarea aleasă
    // (pe Smarald, amestecul de 8% ieșea tot gri-verzui). Textul și steaua ei sunt deja verificate
    // pe relief, prin garda de mai sus.
    fundalBanda: fundalRelief,
    // Mătasea: gradientele, folosite DOAR ca `background` (banda și butoanele pline).
    fundalInchisMatase: banda.css,
    accentMatase: butonMatase.css,
    // Banda „Ce spun clienții" (doar Liniște o desenează): tonul stins al accentului. Textele de pe
    // ea, așa cum ies mai sus, trec 4,5:1 pe orice nuanță (probat în `aspect-culori.proba.mjs`).
    fundalPareri: fundalPareri(accent).css,
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

  // Mătasea: ce stă pe bandă și textul butoanelor trebuie să se citească și pe partea LUMINOASĂ a
  // gradientului, nu doar pe bază — doar unde există mătasea (paletele calculate și cele manuale).
  if (paleta.fundalInchisMatase) {
    const lumina = matase(paleta.fundalInchis).lumina;
    for (const [rolText, numeText] of TEXTE_PE_INCHIS) {
      lista.push({ nume: `${numeText}, pe partea luminoasă a benzii`, text: paleta[rolText], fundal: lumina, minim: PRAG_CONTRAST });
    }
  }
  if (paleta.accentMatase) {
    lista.push({
      nume: "Textul de pe butoane, pe partea luminoasă a butonului",
      text: paleta.accentText,
      fundal: matase(paleta.accent).lumina,
      minim: PRAG_CONTRAST,
    });
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
