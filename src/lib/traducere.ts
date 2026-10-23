/**
 * Site-ul public citit în altă limbă, prin traducerea Google a paginilor (21 oct. 2026).
 *
 * Hotărât de proprietar (18 oct.): cât mai simplu, fără DeepL sau alt serviciu plătit,
 * fără traduceri scrise de client. Deci nu traducem noi nimic: alegerea limbii din antet e
 * un set de LINKURI către adresa de traducere a Google, de forma
 *
 *   https://model--apropiere-vercel-app.translate.goog/servicii?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en
 *
 * Gazda e domeniul site-ului cu fiecare `-` dublat și fiecare `.` făcut `-`, plus
 * `.translate.goog`; coada `_x_tr_*` îi spune lui Google din ce limbă și în ce limbă
 * traduce. Până apasă vizitatorul, pagina NU cere nimic de la Google — ca butonul de
 * WhatsApp, care e tot un simplu link.
 *
 * Ce a arătat proba proprietarului pe `model-apropiere` (21 oct.): prima pagină se
 * traduce, iar o pagină interioară deschisă direct, cu coada, se traduce și ea; dar un
 * clic în meniu pe pagina tradusă dădea „Can't translate this page". Linkurile site-ului
 * sunt relative (`/servicii`), deci pe gazda tradusă duceau la o adresă FĂRĂ coadă, pe
 * care Google n-o mai traduce. De aici `adresaPeTradusa`: pe pagina tradusă, un link
 * intern duce la aceeași gazdă tradusă, cu coada paginii curente.
 *
 * Funcțiile de aici nu ating browserul (primesc adrese, întorc adrese), ca să poată fi
 * probate în Node — vezi `e2e/limbi.proba.mjs`.
 */

/**
 * Șabloanele pe care se poate porni alegerea limbii. Deocamdată doar „Claritate" — cerut de
 * proprietar pe 21 oct. 2026 („hai să aplicăm doar pe claritate"), cum a pornit și „Aspect",
 * de la un singur șablon. Pe celelalte, bifa din Setări nu apare, serverul refuză s-o
 * pornească, iar o valoare rămasă în bază (de pildă după o schimbare de șablon) nu pune
 * bulina pe site. Ca să se deschidă și altora, se adaugă aici cheile lor.
 *
 * Repararea navigării pe pagina tradusă (`navigare-tradusa.tsx`) nu ține de listă: nu se
 * vede, iar la traducerea Google se ajunge pe orice site, și din rezultatele căutării.
 */
export const SABLOANE_CU_TRADUCERE: readonly string[] = ["claritate"];

/**
 * Site-urile (`sites.domain`, potrivire exactă) care au alegerea limbii oricare le-ar fi șablonul.
 * `coterodica.vercel.app` — cerut de proprietar pe 23 oct. 2026, odată cu „Aspect" pe același site
 * („adaugă aceste schimbări… și toggle limbă, pe coterodica.vercel.app").
 */
export const DOMENII_CU_TRADUCERE: readonly string[] = ["coterodica.vercel.app"];

/**
 * Se poate porni alegerea limbii pe site-ul ăsta? Da, dacă șablonul e în `SABLOANE_CU_TRADUCERE`
 * SAU domeniul în `DOMENII_CU_TRADUCERE`. Fără niciunul: nu.
 */
export function traducerePermisa(sablon: string | null | undefined, domeniu?: string | null): boolean {
  if (typeof sablon === "string" && SABLOANE_CU_TRADUCERE.includes(sablon)) return true;
  return typeof domeniu === "string" && DOMENII_CU_TRADUCERE.includes(domeniu);
}

/** Limba în care e scris site-ul. Pagina în limba asta e chiar pagina noastră, nu o traducere. */
export const LIMBA_ORIGINALA = "ro";

/**
 * Limbile din alegerea limbii, în ordinea în care apar. `nume` și `nota` sunt scrise în
 * limba ținută, fiindcă le citește tocmai omul care nu știe română.
 */
export const LIMBI_SITE = [
  { cod: "ro", nume: "Română", nota: "pagina originală" },
  { cod: "en", nume: "English", nota: "automatic translation by Google" },
  { cod: "de", nume: "Deutsch", nota: "automatische Übersetzung von Google" },
] as const;

export type CodLimba = (typeof LIMBI_SITE)[number]["cod"];

const SUFIX = ".translate.goog";
/** Toți parametrii pe care Google îi pune în coadă încep așa (`_x_tr_sl`, `_x_tr_tl`, `_x_tr_hl`…). */
const PREFIX_PARAMETRI = "_x_tr_";

/** E gazda unei pagini citite prin traducerea Google? */
export function esteGazdaTradusa(gazda: string): boolean {
  return gazda.toLowerCase().endsWith(SUFIX);
}

/**
 * Gazda de traducere a unui domeniu: `model-apropiere.vercel.app` →
 * `model--apropiere-vercel-app.translate.goog`.
 *
 * Nu acoperă domeniile cu o etichetă mai lungă de 63 de caractere după codare, la care
 * Google folosește altă formă; un domeniu de cabinet nu ajunge acolo.
 */
export function gazdaTradusa(domeniu: string): string {
  return domeniu.toLowerCase().replace(/-/g, "--").replace(/\./g, "-") + SUFIX;
}

/**
 * Inversul lui `gazdaTradusa`: din gazda tradusă, domeniul site-ului. `null` dacă gazda
 * nu e una de traducere.
 */
export function gazdaOriginala(gazda: string): string | null {
  if (!esteGazdaTradusa(gazda)) return null;
  const codata = gazda.toLowerCase().slice(0, -SUFIX.length);
  // Citit de la stânga la dreapta: `--` e o liniuță adevărată, `-` singur era un punct.
  return codata.replace(/--|-/g, (bucata) => (bucata === "--" ? "-" : "."));
}

/** Scoate coada Google dintr-o căutare, ca să rămână doar parametrii site-ului. */
function faraParametriiTraducerii(parametri: URLSearchParams): URLSearchParams {
  const curati = new URLSearchParams();
  for (const [cheie, valoare] of parametri) {
    if (!cheie.startsWith(PREFIX_PARAMETRI)) curati.append(cheie, valoare);
  }
  return curati;
}

/**
 * Adresa paginii `cale` (cu căutarea ei, fără ancoră) în limba cerută. În română e
 * pagina noastră, pe domeniul site-ului; în rest, aceeași pagină prin traducerea Google.
 *
 * `cale` poate veni și de pe o pagină deja tradusă (cu coada Google în ea): coada veche
 * se scoate, ca trecerea EN → DE să nu lase doi parametri de limbă care se bat cap în cap.
 */
export function adresaInLimba(domeniu: string, cale: string, limba: CodLimba): string {
  const adresa = new URL(cale, `https://${domeniu}`);
  const parametri = faraParametriiTraducerii(adresa.searchParams);

  if (limba !== LIMBA_ORIGINALA) {
    // `hostname`, nu `domeniu`: un domeniu cu port (`ana.test:3000`, doar la noi pe banc)
    // n-are ce căuta în gazda Google.
    adresa.hostname = gazdaTradusa(adresa.hostname);
    parametri.set("_x_tr_sl", LIMBA_ORIGINALA);
    parametri.set("_x_tr_tl", limba);
    // Limba barei Google de deasupra paginii: aceeași cu a traducerii.
    parametri.set("_x_tr_hl", limba);
  }

  adresa.protocol = "https:";
  adresa.port = "";
  adresa.search = parametri.toString();
  adresa.hash = "";
  return adresa.toString();
}

/**
 * În ce limbă e citită acum pagina: română pe domeniul nostru, limba din `_x_tr_tl` pe
 * gazda tradusă. Poate fi și o limbă care nu e în listă (bara Google lasă vizitatorul
 * să aleagă oricare) — atunci în listă nu e bifată nicio limbă.
 */
export function limbaPaginii(gazda: string, cautare: string): string {
  if (!esteGazdaTradusa(gazda)) return LIMBA_ORIGINALA;
  return new URLSearchParams(cautare).get("_x_tr_tl") ?? LIMBA_ORIGINALA;
}

/**
 * Unde trebuie să ducă un link, când pagina e citită prin traducerea Google: la aceeași
 * gazdă tradusă, cu coada de limbă a paginii curente (fără ea, Google răspunde „Can't
 * translate this page"). `null` pentru linkurile care nu sunt ale site-ului — alt site,
 * `mailto:`, `tel:` — și pentru pagina care nu e tradusă: acolo nu e nimic de reparat.
 *
 * Un link scris cu domeniul site-ului întreg (`https://cabinet.ro/blog`) e tot al
 * site-ului, deci trece și el prin traducere.
 */
export function adresaPeTradusa(href: string, paginaCurenta: string): string | null {
  let curenta: URL;
  let tinta: URL;
  try {
    curenta = new URL(paginaCurenta);
    tinta = new URL(href, curenta);
  } catch {
    return null;
  }

  const original = gazdaOriginala(curenta.hostname);
  if (!original) return null;
  if (tinta.protocol !== "https:" && tinta.protocol !== "http:") return null;
  if (tinta.hostname !== curenta.hostname && tinta.hostname !== original) return null;

  const parametri = faraParametriiTraducerii(tinta.searchParams);
  for (const [cheie, valoare] of curenta.searchParams) {
    if (cheie.startsWith(PREFIX_PARAMETRI)) parametri.set(cheie, valoare);
  }

  tinta.protocol = curenta.protocol;
  tinta.host = curenta.host;
  tinta.search = parametri.toString();
  return tinta.toString();
}
