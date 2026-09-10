import type { CampSchema } from "@/lib/sectiuni";

/**
 * O pagină de sine stătătoare: „Tarife", „Cabinetul", „Politica de
 * confidențialitate".
 *
 * Se deosebește de un articol prin ce NU are: dată, timp de citit, copertă, loc
 * într-o listă cronologică. O pagină nu îmbătrânește — de asta nici nu-i punem
 * o dată pe care cineva ar citi-o ca „scrisă acum trei ani, probabil depășită".
 */

/**
 * Adrese pe care o pagină nu le poate lua, fiindcă sunt deja ale altcuiva.
 *
 * Next alege întotdeauna ruta scrisă în cod înaintea celei dinamice, deci o
 * pagină numită „blog" n-ar da o eroare: pur și simplu n-ar fi văzută niciodată
 * de nimeni, iar clientul ar reciti adresa de zece ori întrebându-se ce a
 * greșit. Mai bine îi spunem din formular.
 *
 * Lista acoperă și adrese care nu există încă (`api`, `sitemap.xml`), ca o rută
 * adăugată mâine să nu poată fura pagina cuiva.
 */
export const ADRESE_REZERVATE = [
  "admin",
  "api",
  "blog",
  "dashboard",
  "favicon.ico",
  // Ruta care servește imaginile din depozitul privat.
  "imagini",
  "login",
  // Pagina de așteptare a unui site încă nepublicat.
  "nepublicat",
  // Ecranul public de programare. Lipsea până pe 9 sept. 2026, deși ruta există
  // de pe 27 aug.: panoul accepta o pagină „programare", care apoi nu se vedea
  // niciodată, fiindcă ruta noastră câștigă în fața celei după adresă.
  "opengraph-image",
  "programare",
  // Previzualizarea site-ului de vânzări. Rută de lucru, dar cât timp există,
  // umbrește o pagină a clientului cu aceeași adresă.
  "proba-vanzari",
  "robots.txt",
  "servicii",
  "site-unavailable",
  "sitemap.xml",
] as const;

export const CAMPURI_PAGINA: CampSchema[] = [
  {
    tip: "text",
    cheie: "title",
    eticheta: "Titlul paginii",
    hint: "Apare mare, sus pe pagină, și în meniul din care se ajunge la ea.",
    obligatoriu: true,
    max: 120,
  },
  {
    tip: "slug",
    cheie: "slug",
    dinCheia: "title",
    prefix: "/",
    eticheta: "Adresa paginii",
    hint: "Se completează singură din titlu. O schimbi doar dacă ai un motiv — adresa veche nu mai duce nicăieri după aceea.",
    obligatoriu: true,
    max: 80,
    slugInterzise: [...ADRESE_REZERVATE],
  },
  {
    tip: "textLung",
    cheie: "content",
    eticheta: "Textul paginii",
    obligatoriu: true,
    randuri: 18,
    cuSubtitluri: true,
    /**
     * 5.000 de cuvinte: mai mult decât la un articol, fiindcă aici ajung și
     * textele legale — o politică de confidențialitate scrisă ca lumea are
     * două-trei mii de cuvinte și nu se poate scurta de dragul nostru.
     */
    maxCuvinte: 5000,
    max: 100000,
  },
];

/** Unde se leagă pagina. Coloana `nav_location` din `pages`. */
export type LocMeniu = "header" | "footer" | "none";

export const LOCURI_MENIU: { valoare: LocMeniu; eticheta: string; explicatie: string }[] = [
  {
    valoare: "header",
    eticheta: "În meniul de sus",
    explicatie: "Lângă Despre, Servicii, Contact. Pentru ce caută vizitatorul.",
  },
  {
    valoare: "footer",
    eticheta: "În subsol",
    explicatie: "Jos, pe fiecare pagină. Pentru ce trebuie să existe, dar nu se caută.",
  },
  {
    valoare: "none",
    eticheta: "Nicăieri",
    explicatie: "Se ajunge doar cu adresa dată de tine.",
  },
];

export function esteLocMeniu(valoare: unknown): valoare is LocMeniu {
  return valoare === "header" || valoare === "footer" || valoare === "none";
}

/** O pagină, așa cum o citește site-ul public. */
export type Pagina = {
  id: string;
  slug: string;
  titlu: string;
  continut: string;
  /**
   * Unde se leagă pagina — de care are nevoie și site-ul public, nu doar
   * meniul: „Nicăieri” e explicat clientului prin „Se ajunge doar cu adresa
   * dată de tine", iar promisiunea aia se ține punându-i paginii `noindex`.
   */
  locMeniu: LocMeniu;
};

/** Cât îi trebuie antetului și subsolului ca să pună un link. */
export type LinkPagina = { slug: string; titlu: string; loc: LocMeniu };
