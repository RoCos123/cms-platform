import type { CSSProperties } from "react";
import { citesteAspectCulori, paletaEfectiva } from "@/lib/aspect/culori";
import { citesteAspectFonturi, tipografieEfectiva } from "@/lib/aspect/fonturi";
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
export function getTemplate(id: string | null | undefined, culori?: unknown, fonturi?: unknown): Template {
  const sablon = TEMPLATES[id ?? ""] ?? caldura;

  // Culorile și fonturile alese de client (meniul „Aspect"). Fără ele — sau cu un JSON care nu
  // e valid — se întoarce EXACT obiectul șablonului, nu o copie: site-urile care n-au ales nimic
  // rămân identice, iar un conținut stricat din bază nu poate strica un site public.
  const aspect = citesteAspectCulori(culori);
  const alese = citesteAspectFonturi(fonturi);
  if (!aspect && !alese) return sablon;

  return {
    ...sablon,
    ...(aspect && { paleta: paletaEfectiva(sablon.paleta, aspect) }),
    ...(alese && { tipografie: tipografieEfectiva(sablon.tipografie, alese) }),
  };
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
    // Doar în paleta calculată dintr-o culoare aleasă (linkuri + hover). La șabloane e
    // nedefinită, iar React nu scrie deloc o proprietate `undefined`.
    "--t-accent-interactiv": p.accentInteractiv,
    // La fel, doar în paleta calculată: fundalul benzii cu servicii (vezi `banda-servicii.tsx`).
    "--t-fundal-banda": p.fundalBanda,
    // Mătasea (gradiente, doar ca `background`): banda închisă și butoanele pline.
    "--t-fundal-inchis-matase": p.fundalInchisMatase,
    "--t-accent-matase": p.accentMatase,
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
    // Doar cu fonturi alese în „Aspect": grosimea titlurilor din secțiunile care altfel ar sta pe
    // fontul de text, și cursivele oprite pentru un font secundar fără ele. Fără alegere nu există,
    // iar componentele cad pe valorile de până acum.
    ...(t.fontTitlu && { "--t-greutate-titlu-ales": String(t.greutateTitlu) }),
    ...(t.secundarFaraCursive && { "--t-cursiv-secundar": "normal" }),
    ...(t.accentTitluCursiv && { "--t-stil-accent-titlu": "italic" }),
    "--t-raza": f.raza,
    "--t-raza-buton": f.razaButon,
    "--t-spatiere": f.spatiereSectiune,
  } as CSSProperties;
}

