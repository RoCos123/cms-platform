import { culoriDinBrand } from "./culori";
import { fonturiDinBrand } from "./fonturi";

/**
 * Cine are meniul „Aspect" — deocamdată doar în probă.
 *
 * Cerut de proprietar (18 oct. 2026): „limitează pe șablonul Claritate și pe site-ul meu" — iar
 * site-ul lui e „model claritate" (`model-claritate.vercel.app`, numit în panou „Popescu Robert"),
 * NU sitepsihologi — ca să încerce culorile într-un singur loc înainte să le primească toți
 * clienții. Trebuie să se potrivească AMBELE: șablonul E în listă ȘI domeniul E în listă. Un site
 * Claritate al altui client nu primește nimic; nici site-ul proprietarului, dacă ar trece pe alt
 * șablon.
 *
 * Apoi, câte un șablon pe rând (proprietarul, 20 oct. 2026: „hai să aplicăm treptat, pe fiecare
 * șablon în parte"), fiecare pe site-ul lui model: Lumină pe `model-lumina` („pe model-lumina
 * frate, pe asta să apară"), apoi Căldură pe `model-caldura` („merge, hai la Căldură"), apoi
 * Liniște pe `model-liniste` („merge, hai la Liniște"), apoi Apropiere pe `model-apropiere`
 * („merge, hai la Apropiere"). Cu asta, toate cinci șabloanele au „Aspect" — dar tot doar pe
 * site-ul lor model.
 *
 * Poarta nu e o nevoie tehnică (paleta calculată e probată pe toate cinci șabloanele), ci o
 * măsură de prudență. O ține un SINGUR loc, aici. Ce hotărăște:
 *
 * • meniul „Aspect" din panou și pagina `/dashboard/aspect` (altfel: „Pagina nu există");
 * • salvarea culorilor și fonturilor (altfel refuzată, chiar dacă cineva trimite cererea de mână);
 * • aplicarea lor pe site-ul public și în toate previzualizările din panou — un site din afara
 *   probei le ignoră, chiar dacă în bază ar sta culori sau fonturi salvate.
 *
 * Ca să deschizi pentru toți clienții: fă `aspectPermis` să întoarcă `true`. Nu mai e nimic de
 * schimbat în restul codului, iar culorile deja salvate rămân.
 */

/** Șabloanele pe care e pornit „Aspect". */
export const SABLOANE_CU_ASPECT: readonly string[] = ["claritate", "lumina", "caldura", "liniste", "apropiere"];

/**
 * Domeniile (`sites.domain`) pe care e pornit „Aspect". Potrivire EXACTĂ, nu „conține".
 *
 * Domeniul, nu `sites.id`: platforma își recunoaște oricum site-urile după domeniu, iar id-ul lui
 * „model claritate" nu e în depozit. Dacă domeniul se schimbă (a mai fost redenumit o dată:
 * `cosmin-claritate` → `model-claritate`), poarta se închide singură — fără stricăciuni; se pune
 * noul domeniu aici. Dacă vreodată e nevoie de ceva mai stabil, se trece pe id.
 */
export const DOMENII_CU_ASPECT: readonly string[] = [
  "model-claritate.vercel.app",
  "model-lumina.vercel.app",
  "model-caldura.vercel.app",
  "model-liniste.vercel.app",
  "model-apropiere.vercel.app",
  // Primul site din afara modelelor (proprietarul, 23 oct. 2026: „adaugă aceste schimbări, Aspect —
  // culori și font… pe coterodica.vercel.app"). Pe orice șablon (toate cinci sunt în lista de mai sus).
  "coterodica.vercel.app",
];

/**
 * Șabloanele pe care se poate alege colecția „Mat & Mineral" (finisajul mat), deschise câte unul, ca
 * „Aspect": întâi Claritate (proprietarul, 23 oct. 2026: „fă pe master, dar doar pe un model/șablon,
 * hai pe claritate"), apoi Lumină („merge, hai și pe lumina"), apoi Căldură („merge, hai și pe căldură"),
 * apoi Liniște („merge, hai și pe liniște"), apoi Apropiere („merge, hai și pe apropiere") — cu asta, toate
 * cinci șabloanele.
 * Pe celelalte: comutatorul „Colecția" nu apare în „Aspect", salvarea unui finisaj mat se refuză, iar
 * un „mat" rămas în bază (de pildă după o schimbare de șablon) e citit ca mătăsos — vezi `culoriPermise`.
 * Ca să se deschidă și altora, se adaugă cheile lor aici.
 */
export const SABLOANE_CU_MAT: readonly string[] = ["claritate", "lumina", "caldura", "liniste", "apropiere"];

/** Se poate alege finisajul mat pe un site cu șablonul ăsta? */
export function matPermis(template: string | null | undefined): boolean {
  return typeof template === "string" && SABLOANE_CU_MAT.includes(template);
}

export type SiteAspect = {
  domain: string | null | undefined;
  template: string | null | undefined;
};

/** Cele două liste, ca probele să poată încerca regula și cu alte valori decât cele reale. */
export type ListeAspect = { sabloane: readonly string[]; domenii: readonly string[] };

const LISTE_REALE: ListeAspect = { sabloane: SABLOANE_CU_ASPECT, domenii: DOMENII_CU_ASPECT };

/** Are acest site meniul „Aspect"? Ambele liste trebuie să-l cuprindă. */
export function aspectPermis(site: SiteAspect, liste: ListeAspect = LISTE_REALE): boolean {
  if (!site.domain || !site.template) return false;
  return liste.sabloane.includes(site.template) && liste.domenii.includes(site.domain);
}

/**
 * Culorile alese, DOAR dacă site-ul are „Aspect". Singurul drum prin care culorile din `brand`
 * ajung pe site sau într-o previzualizare: un site din afara probei primește `undefined`, deci
 * `getTemplate` îi întoarce șablonul neatins.
 */
export function culoriPermise(brand: unknown, site: SiteAspect, liste: ListeAspect = LISTE_REALE): unknown {
  if (!aspectPermis(site, liste)) return undefined;
  return faraFinisajNepermis(culoriDinBrand(brand), site.template);
}

/**
 * Culorile din bază, fără finisajul mat acolo unde șablonul nu-l are (`SABLOANE_CU_MAT`): rămân
 * aceleași culori, mătăsoase. Restul nu se atinge.
 */
export function faraFinisajNepermis(culori: unknown, template: string | null | undefined): unknown {
  if (matPermis(template) || typeof culori !== "object" || culori === null || Array.isArray(culori)) return culori;
  if (!("finisaj" in culori)) return culori;
  const copie = { ...(culori as Record<string, unknown>) };
  delete copie.finisaj;
  return copie;
}

/** Fonturile alese, DOAR dacă site-ul are „Aspect" — același drum ca la culori. */
export function fonturiPermise(brand: unknown, site: SiteAspect, liste: ListeAspect = LISTE_REALE): unknown {
  return aspectPermis(site, liste) ? fonturiDinBrand(brand) : undefined;
}
