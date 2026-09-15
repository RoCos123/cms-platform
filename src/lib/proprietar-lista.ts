/**
 * Lista de site-uri din panoul proprietarului: paginare, căutare, filtre.
 *
 * Logică pură, fără bază de date — ca s-o putem proba cu Node (`pnpm test:logica`),
 * și mai ales ca partea sensibilă (curățarea textului căutat înainte să intre
 * într-un filtru PostgREST) să fie apărată de o probă, nu doar de atenția de la
 * review.
 *
 * DE CE EXISTĂ. Panoul încărca TOATE site-urile și toți utilizatorii deodată. La
 * câțiva clienți e instant; la sute–mii devine pagina cea mai grea a platformei —
 * iar primul care simte scara e chiar administratorul. (Findingul F08 din audit.)
 */

/** Câte site-uri pe o pagină. 25 încap comod și țin cererea mică la mii de clienți. */
export const MARIME_PAGINA = 25;

export type StatusFiltru = "toate" | "publicat" | "draft";

/** Statusul cerut; orice altceva (lipsă, gunoi din URL) → „toate". */
export function parseStatus(brut: string | undefined): StatusFiltru {
  return brut === "publicat" || brut === "draft" ? brut : "toate";
}

/**
 * Curăță textul căutat înainte să intre într-un filtru `.or(...)` PostgREST.
 *
 * Filtrul se construiește ca ȘIR (`domain.ilike.%q%,name.ilike.%q%`), iar în acel
 * șir virgula, parantezele și wildcardurile LIKE au înțeles structural. Un `q` cu
 * „,(" ar putea închide un `id.in.(...)` sau strecura condiții în plus — deci
 * scoatem caracterele cu rol structural și wildcardurile, comprimăm spațiile și
 * tăiem lungimea. Rămân literele, cifrele, spațiile și semnele firești dintr-un
 * domeniu sau email (`.`, `-`, `_`, `@`).
 */
export function curataCautarea(brut: string | undefined): string {
  if (!brut) return "";
  return brut
    .replace(/[,()%*\\"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Pagina cerută, cel puțin 1. Un `?p=` aiurea (0, negativ, text, zecimal) → 1. */
export function parsePagina(brut: string | undefined): number {
  const n = Number(brut);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Intervalul `[de, la]` pentru `.range()` (0-indexat, inclusiv la ambele capete). */
export function intervalul(pagina: number, marime = MARIME_PAGINA): { de: number; la: number } {
  const de = (pagina - 1) * marime;
  return { de, la: de + marime - 1 };
}

/** Câte pagini are un total. Cel puțin 1, ca să nu arate „pagina 1 din 0". */
export function numarPagini(total: number, marime = MARIME_PAGINA): number {
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.ceil(total / marime);
}

/**
 * Filtrul `.or(...)` pentru căutare: domeniu SAU nume SAU site-urile ale căror
 * conturi au emailul potrivit (deja rezolvate în `siteIdsEmail`, fiindcă emailul
 * stă în alt tabel). `null` dacă nu se caută nimic. `qCurat` trebuie să vină deja
 * prin `curataCautarea` — aici nu se mai spală nimic.
 */
export function filtruCautare(qCurat: string, siteIdsEmail: string[] = []): string | null {
  if (!qCurat) return null;
  const conditii = [`domain.ilike.%${qCurat}%`, `name.ilike.%${qCurat}%`];
  if (siteIdsEmail.length > 0) conditii.push(`id.in.(${siteIdsEmail.join(",")})`);
  return conditii.join(",");
}
