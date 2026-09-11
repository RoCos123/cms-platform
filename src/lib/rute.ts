/**
 * Ce adrese sunt ale NOASTRE și ce adrese pot fi ale clientului.
 *
 * Fișierul există dintr-o greșeală găsită pe 1 sept. 2026. Proxy-ul hotăra „e
 * pagină de panou?” cu `cale.startsWith("/dashboard")` — iar asta e adevărat și
 * pentru `/dashboard-ul-meu`, o adresă pe care clientul are voie să și-o facă
 * (lista de adrese rezervate oprește doar `dashboard` exact). Urmarea: pagina
 * lui cerea conectare, deci niciun vizitator n-o putea citi. Aceeași greșeală
 * era și în `robots.txt`, unde `Disallow: /dashboard` ar fi ținut pagina aia
 * afară din Google — adică, reparată doar pe jumătate, ar fi mers și n-ar fi
 * fost găsită de nimeni, fără ca nimic să pară stricat.
 *
 * Regula, de aici înainte, într-un singur loc: o adresă e a noastră dacă e
 * FIX una dintre ale noastre, sau dacă e SUB una dintre ele. Nu dacă începe cu
 * literele ei.
 */

/** Rădăcinile rutelor care nu sunt niciodată pagini ale clientului. */
const RADACINI_PROPRII = ["/dashboard", "/admin", "/site-unavailable", "/proprietar"] as const;

function esteSauSub(cale: string, radacina: string): boolean {
  return cale === radacina || cale.startsWith(`${radacina}/`);
}

/** Ecranele panoului. `/dashboard-ul-meu` NU e printre ele. */
export function estePanou(cale: string): boolean {
  return esteSauSub(cale, "/dashboard");
}

/** Ecranul de conectare. Exact, nu ca prefix. */
export function esteConectare(cale: string): boolean {
  return cale === "/login";
}

/**
 * Ecranele panoului de proprietar (tu, peste toate site-urile). Ca la `estePanou`,
 * pe segmente: `/proprietarul-meu` NU e printre ele, deci rămâne o adresă pe care
 * un client și-ar putea-o face.
 *
 * Proxy-ul scoate calea asta din rezolvarea de tenant (nu e a niciunui site);
 * paznicul real e `verificaProprietar` din `src/lib/proprietar.ts`.
 */
export function estePanouProprietar(cale: string): boolean {
  return esteSauSub(cale, "/proprietar");
}

/**
 * Paginile de resetare a parolei, sub `/login`.
 *
 * Stau separat de `esteConectare` dinadins. `esteConectare` hotărăște și
 * redirectarea „ești logat pe /login → mergi la /dashboard" din proxy; dacă
 * paginile astea ar intra acolo, un om venit pe linkul de resetare — care ARE o
 * sesiune de recuperare — ar fi trimis la panou tocmai când vrea să-și pună
 * parola nouă. Aici sunt folosite doar ca să rămână deschise pe un site
 * nepublicat (vezi `seServesteNepublicat`), nu la redirectare.
 */
export const CAI_RESETARE = [
  "/login/parola-uitata",
  "/login/confirma-resetare",
  "/login/parola-noua",
] as const;

export function esteResetareParola(cale: string): boolean {
  return (CAI_RESETARE as readonly string[]).includes(cale);
}

/**
 * Ce se trece în `robots.txt` la `Disallow`.
 *
 * `Disallow` din robots.txt se potrivește ca PREFIX de text, nu ca segment de
 * cale: `Disallow: /dashboard` ar acoperi și `/dashboard-ul-meu`. De asta lista
 * dă bara de la coadă (`/dashboard/`, care prinde tot ce e dedesubt) și, separat,
 * varianta cu `$` pentru adresa în sine.
 *
 * `$` e o extensie pe care Google și Bing o înțeleg, iar restul o ignoră. Nu e
 * o problemă: adresele astea cer oricum conectare și trimit la `/login`, care e
 * și el în listă. Costul unei potriviri ratate e zero; costul uneia în plus ar
 * fi pagina clientului scoasă din căutare.
 */
export const DISALLOW_ROBOTS = [
  ...RADACINI_PROPRII.flatMap((radacina) => [`${radacina}/`, `${radacina}$`]),
  "/login$",
  // Prinde și paginile de resetare a parolei (`/login/parola-noua` etc.): sunt
  // tranzitorii, cer un token din email și n-au ce căuta în căutări.
  "/login/",
];
