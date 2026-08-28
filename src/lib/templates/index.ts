import type { CSSProperties } from "react";
import type { Template, TemplateId } from "./types";
import { caldura } from "./caldura";
import { liniste } from "./liniste";
import { lumina } from "./lumina";
import { apropiere } from "./apropiere";

export * from "./types";

/**
 * Toate patru, construite. Ordinea e cea în care i se arată clientului:
 * „Căldură" primul, fiindcă e superset-ul din care s-au validat secțiunile.
 *
 * Un șablon nou se adaugă aici și în `TemplateId` — restul e un fișier de
 * valori. Contrastul fiecăruia e verificat automat de
 * `e2e/contrast-sabloane.proba.mjs`.
 */
const TEMPLATES: Record<string, Template> = {
  caldura,
  liniste,
  lumina,
  apropiere,
};

/**
 * Șablonul unui site. Necunoscut sau lipsă → cel implicit: un site public trebuie să
 * se randeze mereu, chiar dacă rândul din baza de date a rămas în urma codului.
 */
export function getTemplate(id: string | null | undefined): Template {
  return TEMPLATES[id ?? ""] ?? caldura;
}

export function listTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES;
}

/**
 * Traduce șablonul în variabile CSS, puse o dată pe rădăcina site-ului public.
 * Secțiunile citesc apoi `var(--t-accent)` etc. și nu știu nimic despre culori —
 * asta e ce face ca al doilea șablon să coste un fișier, nu o rescriere.
 */
export function templateStyle(template: Template): CSSProperties {
  const { paleta: p, tipografie: t, forme: f } = template;

  return {
    "--t-fundal": p.fundal,
    "--t-fundal-nuantat": p.fundalNuantat,
    "--t-fundal-inchis": p.fundalInchis,
    "--t-fundal-relief": p.fundalRelief,
    "--t-text": p.text,
    "--t-text-secundar": p.textSecundar,
    "--t-text-pe-inchis": p.textPeInchis,
    "--t-text-secundar-pe-inchis": p.textSecundarPeInchis,
    "--t-accent": p.accent,
    "--t-accent-text": p.accentText,
    "--t-accent-pe-inchis": p.accentPeInchis,
    "--t-eroare": p.eroare,
    "--t-eroare-pe-inchis": p.eroarePeInchis,
    "--t-chenar": p.chenar,
    "--t-font-principal": `"${t.fontPrincipal}", ${t.fallbackPrincipal}`,
    "--t-font-secundar": `"${t.fontSecundar}", ${t.fallbackSecundar}`,
    "--t-stil-accent": t.accentInItalic ? "italic" : "normal",
    "--t-font-titlu": t.titluriInSecundar
      ? `"${t.fontSecundar}", ${t.fallbackSecundar}`
      : `"${t.fontPrincipal}", ${t.fallbackPrincipal}`,
    "--t-greutate-titlu": String(t.greutateTitlu),
    "--t-raza": f.raza,
    "--t-raza-buton": f.razaButon,
    "--t-spatiere": f.spatiereSectiune,
  } as CSSProperties;
}

/**
 * URL-ul Google Fonts pentru fonturile șablonului. Se încarcă doar ce folosește
 * șablonul ales — nu toate fonturile tuturor șabloanelor.
 */
export function templateFontsHref(template: Template): string {
  const { fontPrincipal, fontSecundar } = template.tipografie;
  const family = (name: string, axes: string) =>
    `family=${name.replace(/ /g, "+")}:${axes}`;

  return (
    "https://fonts.googleapis.com/css2?" +
    [
      family(fontPrincipal, "wght@400;500;600;700;800"),
      family(fontSecundar, "ital,wght@0,300;0,400;0,500;1,300;1,400"),
    ].join("&") +
    "&display=swap"
  );
}
