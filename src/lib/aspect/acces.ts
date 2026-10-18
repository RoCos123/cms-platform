import { culoriDinBrand } from "./culori";

/**
 * Cine are meniul „Aspect" — deocamdată doar în probă.
 *
 * Cerut de proprietar (18 oct. 2026): „limitează pe șablonul Claritate și pe site-ul meu" —
 * și apoi, lămurit: site-ul Popescu Robert, NU sitepsihologi — ca să încerce culorile într-un
 * singur loc înainte să le primească toți clienții. Trebuie să se potrivească AMBELE: șablonul
 * E în listă ȘI site-ul E în listă. Un site Claritate al altui client nu primește nimic; nici
 * site-ul proprietarului, dacă ar trece pe alt șablon.
 *
 * Poarta nu e o nevoie tehnică (paleta calculată e probată pe toate cinci șabloanele), ci o
 * măsură de prudență. O ține un SINGUR loc, aici. Ce hotărăște:
 *
 * • meniul „Aspect" din panou și pagina `/dashboard/aspect` (altfel: 404);
 * • salvarea culorilor (altfel refuzată, chiar dacă cineva trimite cererea de mână);
 * • aplicarea culorilor pe site-ul public și în toate previzualizările din panou — un site
 *   din afara probei le ignoră, chiar dacă în bază ar sta culori salvate.
 *
 * Ca să deschizi pentru toți clienții: fă `aspectPermis` să întoarcă `true`. Nu mai e nimic de
 * schimbat în restul codului, iar culorile deja salvate rămân.
 */

/** Șabloanele pe care e pornit „Aspect". */
export const SABLOANE_CU_ASPECT: readonly string[] = ["claritate"];

/**
 * Site-urile pe care e pornit „Aspect", după `sites.id` (nu după domeniu: domeniul se mută, id-ul nu).
 *
 * GOALĂ deocamdată, dinadins: proprietarul a cerut „Aspect" pe site-ul lui (Popescu Robert, pe
 * Claritate), NU pe sitepsihologi, iar id-ul acelui site nu e în depozit — se află cu
 * `supabase/cauta-site-aspect.sql`. Cât lista e goală, „Aspect" nu apare nicăieri.
 */
export const SITE_URI_CU_ASPECT: readonly string[] = [];

export type SiteAspect = {
  siteId: string | null | undefined;
  template: string | null | undefined;
};

/** Cele două liste, ca probele să poată încerca regula și cu alte valori decât cele reale. */
export type ListeAspect = { sabloane: readonly string[]; siteuri: readonly string[] };

const LISTE_REALE: ListeAspect = { sabloane: SABLOANE_CU_ASPECT, siteuri: SITE_URI_CU_ASPECT };

/** Are acest site meniul „Aspect"? Ambele liste trebuie să-l cuprindă. */
export function aspectPermis(site: SiteAspect, liste: ListeAspect = LISTE_REALE): boolean {
  if (!site.siteId || !site.template) return false;
  return liste.sabloane.includes(site.template) && liste.siteuri.includes(site.siteId);
}

/**
 * Culorile alese, DOAR dacă site-ul are „Aspect". Singurul drum prin care culorile din `brand`
 * ajung pe site sau într-o previzualizare: un site din afara probei primește `undefined`, deci
 * `getTemplate` îi întoarce șablonul neatins.
 */
export function culoriPermise(brand: unknown, site: SiteAspect, liste: ListeAspect = LISTE_REALE): unknown {
  return aspectPermis(site, liste) ? culoriDinBrand(brand) : undefined;
}
