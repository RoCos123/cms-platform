import type { TemplatePalette } from "@/lib/templates/types";
import { normalizeazaHex, oklchDinHex, hexDinOklch } from "./culoare";
import { bazaManuala, matase } from "./paleta";

/**
 * Culorile alese de un client pentru site-ul lui (meniul „Aspect").
 *
 * Stau în `site_settings.brand.aspect.culori` — JSONB, deci fără migrare — și au două
 * moduri:
 *
 * • AUTOMAT: clientul alege o singură culoare, iar restul paletei se calculează din ea
 *   (`paletaDinCuloare`), cu lizibilitatea garantată.
 * • MANUAL: pornește de la paleta calculată (sau de la a șablonului, dacă n-a ales nicio
 *   culoare principală) și clientul schimbă fiecare culoare în parte. Lizibilitatea NU mai e
 *   garantată — a cerut-o proprietarul platformei: „nu contează dacă e lizibil sau nu,
 *   își asumă". Panoul îi arată doar avertismente, fără să-l oprească.
 *
 * Ce vine din bază nu se crede: un JSON scris de mână sau rămas dintr-o versiune veche nu
 * are voie să strice site-ul public. Orice nu e valid se ignoră, iar un site fără culori
 * valide arată exact ca șablonul (același obiect, aceleași variabile CSS, octet cu octet).
 */

export type ModCulori = "auto" | "manual";

/**
 * Cele nouă culori pe care le poate schimba un client în modul manual, cu numele lor pe
 * înțelesul lui (a noua, „Linkurile", din 19 oct. 2026, odată cu paleta premium). Restul rolurilor din paletă (chenarele, culoarea erorilor, fundalul
 * secțiunilor mai închise) se calculează din ele: n-ar spune nimic unui psiholog.
 */
export const ROLURI_MANUALE = [
  {
    cheie: "fundal",
    nume: "Fundalul paginii",
    explicatie: "Culoarea din spatele majorității paginii.",
  },
  {
    cheie: "fundalNuantat",
    nume: "Fundalul secțiunilor nuanțate",
    explicatie: "Fundalul unor secțiuni și al cartonașelor, puțin diferit de cel al paginii.",
  },
  {
    cheie: "fundalInchis",
    nume: "Fundalul benzilor închise",
    explicatie: "Benzile închise la culoare dintre secțiuni și partea de jos a paginii.",
  },
  { cheie: "text", nume: "Textul", explicatie: "Titlurile și paragrafele." },
  {
    cheie: "textSecundar",
    nume: "Textul discret",
    explicatie: "Textul mai mic și mai estompat, de sub titluri.",
  },
  {
    cheie: "accent",
    nume: "Culoarea principală",
    explicatie: "Butoanele pline, linkurile și cuvintele colorate din titluri.",
  },
  {
    cheie: "accentText",
    nume: "Textul de pe butoane",
    explicatie: "Culoarea scrisului de pe butoanele pline.",
  },
  {
    cheie: "accentPeInchis",
    nume: "Culoarea principală pe fundal închis",
    explicatie: "Aceeași culoare principală, dar așa cum apare pe benzile închise.",
  },
  {
    cheie: "accentInteractiv",
    nume: "Linkurile",
    explicatie: "Linkurile din text și culoarea butoanelor când treci cu mausul peste ele.",
  },
] as const;

export type RolManual = (typeof ROLURI_MANUALE)[number]["cheie"];

const CHEI_MANUALE: readonly string[] = ROLURI_MANUALE.map((rol) => rol.cheie);

export type AspectCulori = {
  mod: ModCulori;
  /** Culoarea aleasă (`#RRGGBB`); din ea se calculează paleta. Poate lipsi în modul manual. */
  principala: string | null;
  /** Doar ce a schimbat clientul în modul manual; restul rămâne cum l-a calculat paleta. */
  manual: Partial<Record<RolManual, string>>;
  /** A bifat „înțeleg că poate fi greu de citit". Nu schimbă nimic pe site. */
  asumat: boolean;
};

/**
 * Culorile din bază, curățate. `null` = nicio culoare proprie valabilă, deci site-ul arată
 * cum l-a făcut șablonul.
 */
export function citesteAspectCulori(brut: unknown): AspectCulori | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const sursa = brut as Record<string, unknown>;

  const mod: ModCulori | null = sursa.mod === "auto" || sursa.mod === "manual" ? sursa.mod : null;
  if (!mod) return null;

  const principala = normalizeazaHex(sursa.principala);

  const manual: Partial<Record<RolManual, string>> = {};
  if (typeof sursa.manual === "object" && sursa.manual !== null && !Array.isArray(sursa.manual)) {
    for (const [cheie, valoare] of Object.entries(sursa.manual as Record<string, unknown>)) {
      const hex = normalizeazaHex(valoare);
      if (hex && CHEI_MANUALE.includes(cheie)) manual[cheie as RolManual] = hex;
    }
  }

  // Automat fără culoare, sau manual fără nicio culoare și fără bază: nimic de aplicat.
  if (mod === "auto" && !principala) return null;
  if (mod === "manual" && !principala && Object.keys(manual).length === 0) return null;

  return { mod, principala, manual, asumat: sursa.asumat === true };
}

/** Culorile din `brand` (un JSONB venit din bază), ca să le citească și cadrul, și panoul. */
export function culoriDinBrand(brand: unknown): unknown {
  if (typeof brand !== "object" || brand === null) return undefined;
  const aspect = (brand as Record<string, unknown>).aspect;
  if (typeof aspect !== "object" || aspect === null) return undefined;
  return (aspect as Record<string, unknown>).culori;
}

/**
 * Când se schimbă fundalul în modul manual, fundalul „mai închis" și chenarul se mută odată
 * cu el, cu aceeași distanță față de el ca în paleta de bază — altfel clientul ar schimba
 * fundalul paginii și ar rămâne cu un fundal de relief din altă lume.
 */
function dinFundalNou(baza: TemplatePalette, fundalNou: string, rolDeBaza: string): string {
  const fundalVechi = oklchDinHex(baza.fundal);
  const nou = oklchDinHex(fundalNou);
  const rol = oklchDinHex(rolDeBaza);

  return hexDinOklch({
    l: nou.l + (rol.l - fundalVechi.l),
    c: Math.max(0, nou.c + (rol.c - fundalVechi.c)),
    h: nou.h,
  });
}

/** Paleta care ajunge efectiv pe site: a șablonului, rafinată de ce a ales clientul. */
export function paletaEfectiva(sablon: TemplatePalette, aspect: AspectCulori): TemplatePalette {
  // În modul automat `principala` există mereu (`citesteAspectCulori` o cere), deci baza e
  // paleta calculată; în cel manual poate lipsi, iar baza e a șablonului (plus linkurile).
  const baza = bazaManuala(sablon, aspect.principala);
  if (aspect.mod === "auto") return baza;

  const paleta: TemplatePalette = { ...baza };
  for (const rol of ROLURI_MANUALE) {
    const valoare = aspect.manual[rol.cheie];
    if (valoare) paleta[rol.cheie] = valoare;
  }

  if (aspect.manual.fundal) {
    paleta.fundalRelief = dinFundalNou(baza, aspect.manual.fundal, baza.fundalRelief);
    paleta.chenar = paleta.fundalRelief;
    // Banda cu servicii stă pe relief: se mută odată cu el.
    if (paleta.fundalBanda) paleta.fundalBanda = paleta.fundalRelief;
  }

  // Mătasea se reface din culorile FINALE: omul poate schimba banda sau butonul de mână.
  paleta.fundalInchisMatase = matase(paleta.fundalInchis).css;
  paleta.accentMatase = matase(paleta.accent).css;

  return paleta;
}
