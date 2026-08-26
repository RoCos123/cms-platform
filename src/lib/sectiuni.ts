/**
 * Ce știe panoul despre secțiunile paginii principale.
 *
 * Deliberat separat de `src/components/site/render-sections.tsx`: acela e
 * registrul de RANDARE și trage după el toate componentele site-ului public.
 * Panoul are nevoie doar de nume și reguli, deci nu trebuie să plătească
 * bundle-ul întregului site ca să afișeze o listă.
 *
 * Numele sunt cele confirmate în decizii-faza-0.md §6 („vocabularul e al
 * clientului, nu al developerului"), plus cele trei secțiuni descoperite în
 * șabloane și corecția `logos` din design/sabloane/README.md.
 */

export type MetaSectiune = {
  cheie: string;
  /** Numele arătat clientului în panou. */
  nume: string;
  /** O propoziție care spune la ce folosește secțiunea, nu cum e construită. */
  descriere: string;
  /**
   * Poate apărea de mai multe ori pe aceeași pagină?
   *
   * Aici se ține regula, nu în baza de date: migrarea 20260826130000 a scos
   * constrângerea `unique (site_id, key)` tocmai fiindcă Postgres n-are cum să
   * știe că banda cu citat e repetabilă, iar secțiunea „Servicii" nu.
   */
  repetabila: boolean;
};

const LISTA: MetaSectiune[] = [
  {
    cheie: "hero",
    nume: "Prima secțiune",
    descriere: "Ce vede omul în primele două secunde: cine ești și ce faci.",
    repetabila: false,
  },
  {
    cheie: "aboutTeaser",
    nume: "Despre mine (pe prima pagină)",
    descriere: "Scurtă prezentare, cu trimitere către pagina completă.",
    repetabila: false,
  },
  {
    cheie: "quote",
    nume: "Bandă cu citat",
    descriere: "Un singur gând, pe toată lățimea. Respiro între blocurile grele.",
    repetabila: true,
  },
  {
    cheie: "features",
    nume: "Serviciile mele",
    descriere: "Ce oferi, fiecare cu o descriere scurtă.",
    repetabila: false,
  },
  {
    cheie: "howItWorks",
    nume: "Cum decurge colaborarea",
    descriere: "Pașii de la primul mesaj la ședințele propriu-zise.",
    repetabila: false,
  },
  {
    cheie: "logos",
    nume: "Apariții și acreditări",
    descriere: "Emisiuni, podcasturi, articole în presă.",
    repetabila: false,
  },
  {
    cheie: "testimonials",
    nume: "Păreri",
    descriere: "Mărturii de la oameni cu care ai lucrat.",
    repetabila: false,
  },
  {
    cheie: "portfolio",
    nume: "Programe și materiale",
    descriere: "Ateliere, retreaturi, programe de grup.",
    repetabila: false,
  },
  {
    cheie: "latestPosts",
    nume: "Articole recente",
    descriere: "Ultimele articole de pe blog. Textele vin din Blog, nu de aici.",
    repetabila: false,
  },
  {
    cheie: "faq",
    nume: "Întrebări frecvente",
    descriere: "Răspunsuri la ce te-ar întreba oricine înainte de prima ședință.",
    repetabila: false,
  },
  {
    cheie: "newsletter",
    nume: "Newsletter",
    descriere: "Invitație de abonare la lista ta de email.",
    repetabila: false,
  },
  {
    cheie: "contact",
    nume: "Contact",
    descriere: "Formularul prin care îți ajunge un mesaj, plus datele cabinetului.",
    repetabila: false,
  },
];

const DUPA_CHEIE = new Map(LISTA.map((meta) => [meta.cheie, meta]));

export function metaSectiune(cheie: string): MetaSectiune | null {
  return DUPA_CHEIE.get(cheie) ?? null;
}

export function listaSectiuni(): MetaSectiune[] {
  return LISTA;
}
