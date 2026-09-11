/**
 * Unde poate să ducă un buton de pe site.
 *
 * DE CE EXISTĂ. Butoanele („link") aveau o singură casetă de adresă, scrisă de
 * mână, cu exemplul „/contact". Dar `/contact` NU e o pagină — secțiunea de
 * contact stă pe prima pagină și se ajunge la ea cu `#contact`. Cine urma
 * exemplul ajungea la o pagină inexistentă (404). Așa că, în loc de o casetă
 * liberă, clientul alege dintr-o listă cu locurile care CHIAR există pe site-ul
 * lui: secțiunile de pe pagină și paginile de sine stătătoare. „O altă adresă"
 * rămâne, pentru un link în afară.
 *
 * Toate secțiunile stau pe aceeași pagină (prima), deci un `#ancoră` între ele
 * duce mereu unde trebuie — de-aia le putem oferi fără să ne întrebăm „pe ce
 * pagină e butonul". Paginile se leagă cu `/adresă`, care merge de oriunde.
 *
 * Logică pură (fără bază de date, fără DOM): lista de secțiuni și de pagini vine
 * ca argument, ca s-o putem proba cu Node.
 */

export type Destinatie = { eticheta: string; href: string };

/**
 * Cheia secțiunii → ancora ei de pe pagină și numele sub care o recunoaște
 * clientul într-o listă de „unde duce butonul".
 *
 * Doar secțiunile la care are sens să trimiți cu un buton și care au o ancoră
 * (un `id` în componentă). `hero` și `quote` n-au ancoră; nu apar aici.
 *
 * Ancorele TREBUIE să fie exact `id`-urile din componentele de secțiune
 * (`<Section id="…">`) — altfel butonul ar duce în gol. Probate în
 * `e2e/destinatii.proba.mjs`.
 */
export const ANCORE_SECTIUNI: Record<string, { ancora: string; eticheta: string }> = {
  features: { ancora: "servicii", eticheta: "Serviciile mele" },
  aboutTeaser: { ancora: "despre", eticheta: "Despre mine" },
  howItWorks: { ancora: "proces", eticheta: "Cum decurge" },
  portfolio: { ancora: "programe", eticheta: "Programe și experiențe" },
  pricing: { ancora: "pachete", eticheta: "Pachete" },
  testimonials: { ancora: "pareri", eticheta: "Păreri" },
  faq: { ancora: "intrebari", eticheta: "Întrebări" },
  logos: { ancora: "aparitii", eticheta: "Apariții" },
  latestPosts: { ancora: "articole", eticheta: "Articole" },
  programare: { ancora: "programare", eticheta: "Programare online" },
  contact: { ancora: "contact", eticheta: "Formularul de contact" },
  newsletter: { ancora: "newsletter", eticheta: "Abonare la noutăți" },
};

/** O pagină de sine stătătoare, cât ne trebuie ca s-o oferim ca destinație. */
export type PaginaDestinatie = { slug: string; titlu: string };

/**
 * Lista de destinații pentru un buton: secțiunile VIZIBILE de pe pagină (în
 * ordinea din `ANCORE_SECTIUNI`, nu cea din care vin — să fie mereu la fel), apoi
 * paginile de sine stătătoare.
 *
 * `cheiVizibile` sunt cheile secțiunilor chiar pornite pe site: una ascunsă n-are
 * ancoră pe pagină, deci un buton către ea n-ar duce nicăieri.
 */
export function construiesteDestinatii(
  cheiVizibile: string[],
  pagini: PaginaDestinatie[] = [],
): Destinatie[] {
  const prezente = new Set(cheiVizibile);

  const dinSectiuni = Object.entries(ANCORE_SECTIUNI)
    .filter(([cheie]) => prezente.has(cheie))
    .map(([, { ancora, eticheta }]) => ({ eticheta, href: `#${ancora}` }));

  const dinPagini = pagini.map((pagina) => ({
    eticheta: pagina.titlu,
    href: `/${pagina.slug}`,
  }));

  return [...dinSectiuni, ...dinPagini];
}
