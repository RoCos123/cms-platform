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
    /*
     * Familiile de fonturi NU sunt aici, ci în `templateFontStyle` din
     * `fonturi.ts`, și se pun lângă astea de către componentă.
     *
     * Nu e o împărțire de dragul curățeniei. `next/font` se poate încărca doar
     * înăuntrul build-ului Next; adus aici, ar fi făcut tot fișierul ăsta
     * neîncărcabil în Node curat — iar probele de contrast, care citesc
     * culorile de mai sus, s-au și rupt când am încercat. Ce e judecată pură
     * rămâne probabil; ce ține de unelte stă separat.
     */
    "--t-stil-accent": t.accentInItalic ? "italic" : "normal",
    "--t-greutate-titlu": String(t.greutateTitlu),
    "--t-raza": f.raza,
    "--t-raza-buton": f.razaButon,
    "--t-spatiere": f.spatiereSectiune,
  } as CSSProperties;
}

