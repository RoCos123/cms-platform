import { ANCORE_SECTIUNI } from "@/lib/destinatii";
import type { LinkAntet } from "@/components/site/header-nav";

/**
 * Regulile meniului implicit din antet, rupte de `header.tsx` ca să poată fi
 * probate în Node (un `.tsx` nu se poate rula acolo). `pnpm test:logica`.
 */

/** Cheia secțiunii „Despre mine" în `site_content`. */
const CHEIA_DESPRE = "aboutTeaser";

/**
 * „Despre" intră în meniu doar dacă secțiunea la care duce e PORNITĂ.
 *
 * Până pe 8 oct. 2026 linkul era mereu acolo. Pe un site cu „Despre mine" oprit
 * (sitepsihologi.ro) apăsarea nu făcea nimic — doar punea `#despre` în adresă — iar
 * un meniu cu o intrare moartă arată ca un site stricat. Aceeași regulă ca la
 * „Blog": intrarea apare doar când are ce arăta.
 */
export function esteDespreVizibila(cheiVizibile: readonly string[]): boolean {
  return cheiVizibile.includes(CHEIA_DESPRE);
}

/**
 * Linkul din bară cerut de secțiunea „Pachete", din câmpul „Link în bara de sus".
 *
 * `date` e `data` rândului „pricing" așa cum vine din bază — JSON necunoscut, deci
 * se verifică aici, nu se presupune. Fără link când:
 * - textul e gol sau doar spații (câmp lăsat liber = nu vrea link);
 * - nu e niciun pachet: secțiunea fără pachete nu se afișează deloc, deci linkul ar
 *   duce într-un loc care nu există — aceeași greșeală ca la „Despre".
 *
 * Că secțiunea e și pornită o hotărăște interogarea (`dateleSectiuniiPachete`).
 */
export function linkPachete(date: unknown): LinkAntet | null {
  if (typeof date !== "object" || date === null) return null;

  const { linkMeniu, pachete } = date as { linkMeniu?: unknown; pachete?: unknown };
  const text = typeof linkMeniu === "string" ? linkMeniu.trim() : "";

  if (text === "") return null;
  if (!Array.isArray(pachete) || pachete.length === 0) return null;

  return { text, href: `/#${ANCORE_SECTIUNI.pricing.ancora}` };
}

/**
 * Adresele încep cu „/", nu cu „#".
 *
 * Un „#despre" e un loc din PAGINA CURENTĂ. Pe prima pagină merge; pe pagina de
 * servicii nu există nimic cu numele acela, deci apăsarea nu face nimic — omul
 * rămâne blocat, cu impresia că site-ul e stricat. „/#despre" spune „du-te la
 * prima pagină, la secțiunea despre", și merge de oriunde.
 */
export function linkuriImplicite({
  areDespre,
  paginaServicii,
  blog,
  paginiProprii,
  linkuriSectiuni = [],
}: {
  areDespre: boolean;
  paginaServicii: boolean;
  blog: "pagina" | "sectiune" | null;
  paginiProprii: LinkAntet[];
  /** Intrări cerute de secțiuni (ex. „Prețuri"); vin după „Servicii". */
  linkuriSectiuni?: LinkAntet[];
}): LinkAntet[] {
  return [
    ...(areDespre ? [{ text: "Despre", href: `/#${ANCORE_SECTIUNI.aboutTeaser.ancora}` }] : []),
    { text: "Servicii", href: paginaServicii ? "/servicii" : "/#servicii" },
    ...linkuriSectiuni,
    // Un meniu cu patru intrări din care una nu face nimic e mai rău decât unul
    // cu trei: prima dă impresia unui site stricat, a doua e doar un site fără blog.
    ...(blog ? [{ text: "Blog", href: blog === "pagina" ? "/blog" : "/#articole" }] : []),
    // Paginile proprii intră aici, nu la coadă: „Contact" rămâne ultimul, unde
    // îl caută toată lumea de douăzeci de ani încoace.
    ...paginiProprii,
    { text: "Contact", href: "/#contact" },
  ];
}
