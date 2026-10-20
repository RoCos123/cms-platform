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
export const SABLOANE_CU_ASPECT: readonly string[] = ["claritate"];

/**
 * Domeniile (`sites.domain`) pe care e pornit „Aspect". Potrivire EXACTĂ, nu „conține".
 *
 * Domeniul, nu `sites.id`: platforma își recunoaște oricum site-urile după domeniu, iar id-ul lui
 * „model claritate" nu e în depozit. Dacă domeniul se schimbă (a mai fost redenumit o dată:
 * `cosmin-claritate` → `model-claritate`), poarta se închide singură — fără stricăciuni; se pune
 * noul domeniu aici. Dacă vreodată e nevoie de ceva mai stabil, se trece pe id.
 */
export const DOMENII_CU_ASPECT: readonly string[] = ["model-claritate.vercel.app"];

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
  return aspectPermis(site, liste) ? culoriDinBrand(brand) : undefined;
}

/** Fonturile alese, DOAR dacă site-ul are „Aspect" — același drum ca la culori. */
export function fonturiPermise(brand: unknown, site: SiteAspect, liste: ListeAspect = LISTE_REALE): unknown {
  return aspectPermis(site, liste) ? fonturiDinBrand(brand) : undefined;
}
