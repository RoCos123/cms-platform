import { culoriDinBrand } from "./culori";
import { fonturiDinBrand } from "./fonturi";

/**
 * Cine are meniul „Aspect": TOȚI CLIENȚII, din 23 oct. 2026 (proprietarul: „hai să deschidem Aspect
 * pentru toți clienții"), pe oricare dintre cele cinci șabloane — în afară de pagina de vânzare a
 * platformei (`DOMENII_FARA_ASPECT`).
 *
 * Istoria, pe scurt: a pornit în probă pe „model claritate" (18 oct.: „limitează pe șablonul Claritate
 * și pe site-ul meu" — NU sitepsihologi), apoi câte un șablon pe rând, fiecare pe site-ul lui model
 * (20–21 oct.), apoi pe primul site de client, `coterodica.vercel.app` (23 oct.), apoi la toți.
 *
 * Poarta nu mai e o măsură de probă, ci regula: o ține un SINGUR loc, aici. Ce hotărăște:
 *
 * • meniul „Aspect" din panou și pagina `/dashboard/aspect` (altfel: „Pagina nu există");
 * • salvarea culorilor și fonturilor (altfel refuzată, chiar dacă cineva trimite cererea de mână);
 * • aplicarea lor pe site-ul public și în toate previzualizările din panou — un site fără „Aspect" le
 *   ignoră, chiar dacă în bază ar sta culori sau fonturi salvate.
 *
 * Deschiderea nu schimbă niciun site: fără culori sau fonturi alese, fiecare arată exact ca șablonul lui.
 */

/** Șabloanele pe care e pornit „Aspect": toate cinci. Un șablon necunoscut rămâne închis. */
export const SABLOANE_CU_ASPECT: readonly string[] = ["claritate", "lumina", "caldura", "liniste", "apropiere"];

/**
 * Site-urile (`sites.domain`, potrivire EXACTĂ) care NU au „Aspect": pagina de vânzare a platformei,
 * pe adresa de acum și pe cele viitoare. Hotărârea din 18 oct. („NU sitepsihologi") rămâne și după
 * deschiderea pentru clienți: sitepsihologi nu e un client. Ca să-l aibă și el, se scoate de aici.
 */
export const DOMENII_FARA_ASPECT: readonly string[] = [
  "sitepsihologi.vercel.app",
  "sitepsihologi.ro",
  "www.sitepsihologi.ro",
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
export type ListeAspect = { sabloane: readonly string[]; exceptii: readonly string[] };

const LISTE_REALE: ListeAspect = { sabloane: SABLOANE_CU_ASPECT, exceptii: DOMENII_FARA_ASPECT };

/** Are acest site meniul „Aspect"? Șablonul e în listă și domeniul NU e printre excepții. */
export function aspectPermis(site: SiteAspect, liste: ListeAspect = LISTE_REALE): boolean {
  if (!site.domain || !site.template) return false;
  return liste.sabloane.includes(site.template) && !liste.exceptii.includes(site.domain);
}

/**
 * Culorile alese, DOAR dacă site-ul are „Aspect". Singurul drum prin care culorile din `brand`
 * ajung pe site sau într-o previzualizare: un site fără „Aspect" primește `undefined`, deci
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
