import type { CSSProperties } from "react";
import type { Template, TemplateId } from "./types";
import { caldura } from "./caldura";
import { liniste } from "./liniste";
import { lumina } from "./lumina";
import { apropiere } from "./apropiere";
import { claritate } from "./claritate";

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
  claritate,
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

  // „Apropiere" poartă tratamentul prietenos pentru etichete și accentul de
  // titlu. Restul șabloanelor lasă variabilele astea nedefinite, iar
  // componentele cad pe forma de dinainte prin `var(--x, implicit)`.
  const friendly = template.id === "apropiere";

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
    // Doar „Apropiere" le pune; la restul rămân nedefinite, iar componentele
    // care le folosesc cad pe forma dinainte prin `var(--…, implicit)`.
    "--t-accent-cald": p.accentCald,
    "--t-accent-cald-inchis": p.accentCaldInchis,
    // Tratamentul prietenos, doar pe „Apropiere": eticheta mică e o pastilă
    // (nu majuscule răsfirate), iar accentul scris de mână din titlurile de
    // secțiune e piersică apăsată. Vezi `SectionEyebrow` și `SectionHeading`.
    ...(friendly && {
      // Suprafața cardurilor prietenoase: ALB, ca la sursă (`--surface: #fff`),
      // ca să iasă în relief peste crem. Fără el, cardul era tot crem și abia se
      // vedea pe fundalul paginii. Doar aici; celelalte cad pe crem prin fallback.
      "--t-suprafata": "#ffffff",
      "--t-eticheta-fundal": p.fundalNuantat,
      "--t-eticheta-chenar": p.chenar,
      "--t-eticheta-padding": "6px 14px",
      "--t-eticheta-raza": "100px",
      "--t-eticheta-transform": "none",
      "--t-eticheta-spatiere": "0.02em",
      // Pastila e mereu deschisă, deci textul ei trebuie să rămână verde-închis
      // oricare ar fi tonul secțiunii — nu `--s-accent`, care pe ton închis ar
      // da verde-deschis pe pastilă deschisă. Aceeași grijă ca la bulina din hero.
      "--t-eticheta-culoare": p.accent,
      "--t-accent-titlu": p.accentCaldInchis,
      "--t-greutate-accent-titlu": "700",
    }),
    // „Liniște" folosește și el o suprafață ALBĂ pentru cardurile editoriale
    // (stâlpii „Cum lucrez"), ca la referință, unde `--surface: #fff` iese în
    // relief peste crem. Doar aici; restul cad pe crem prin fallback, iar
    // componentele o citesc doar când un steag din `asezari` o cere.
    ...(template.id === "liniste" && {
      "--t-suprafata": "#ffffff",
    }),
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

