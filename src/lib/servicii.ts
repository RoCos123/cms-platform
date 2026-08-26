import type { CampSchema } from "@/lib/sectiuni";

/**
 * Un serviciu, așa cum îl scrie clientul.
 *
 * Se scrie O SINGURĂ DATĂ, aici. Cartonașul de pe prima pagină ia numele și
 * descrierea scurtă; pagina de servicii le ia pe toate. Fără regula asta,
 * clientul ar scrie fiecare serviciu de două ori, iar peste trei luni ar
 * schimba prețul într-un loc și l-ar uita în celălalt — site-ul s-ar contrazice
 * singur, exact ce semnala auditul site-ului original.
 */

export const CAMPURI_SERVICIU: CampSchema[] = [
  {
    tip: "text",
    cheie: "title",
    eticheta: "Numele serviciului",
    hint: "Cum îi spui tu. Ex.: Consiliere parentală.",
    obligatoriu: true,
    max: 120,
  },
  {
    tip: "slug",
    cheie: "slug",
    dinCheia: "title",
    prefix: "/servicii#",
    eticheta: "Adresa pe pagina de servicii",
    hint: "Cu ea se poate trimite cineva direct la serviciul acesta. Se completează singură din nume.",
    obligatoriu: true,
    max: 80,
  },
  {
    tip: "textLung",
    cheie: "excerpt",
    eticheta: "Descrierea scurtă",
    hint: "Cele două rânduri de pe cartonașul din prima pagină. Cât să înțeleagă cineva dintr-o privire dacă e pentru el.",
    obligatoriu: true,
    randuri: 3,
    max: 300,
  },
  {
    tip: "textLung",
    cheie: "content",
    eticheta: "Descrierea completă",
    hint: "Ce se citește pe pagina de servicii: cui se adresează, cum decurge, la ce să se aștepte. Enter face paragraf nou, iar un rând care începe cu ## și un spațiu devine subtitlu. Lasă gol dacă n-ai pornit pagina de servicii — atunci nu are unde să apară.",
    randuri: 10,
    /**
     * 600 de cuvinte — vreo trei minute de citit. Mai puțin decât la un articol,
     * și dinadins: pagina de servicii le arată pe TOATE una sub alta, iar șase
     * servicii scrise fiecare cât un articol fac o pagină pe care n-o mai
     * citește nimeni până la capăt. Cele mai bune descrieri stau în 150–400.
     */
    maxCuvinte: 600,
    /**
     * Plasa de dedesubt, în caractere (vezi `CAMPURI_ARTICOL`): douăzeci de
     * caractere pe cuvânt, mult peste media limbii române, deci nu poate tăia
     * niciodată o descriere care respectă limita în cuvinte.
     */
    max: 12000,
  },
  {
    tip: "text",
    cheie: "price_label",
    eticheta: "Preț",
    hint: "Scris cum vrei tu: „250 lei / ședință” sau „de la 200 lei”. Lasă gol dacă preferi să nu-l afișezi.",
    max: 80,
  },
  {
    tip: "text",
    cheie: "duration_label",
    eticheta: "Durata unei ședințe",
    hint: "Ex.: 50 de minute.",
    max: 80,
  },
];

/** Un serviciu, așa cum îl citește site-ul public. */
export type Serviciu = {
  id: string;
  slug: string;
  titlu: string;
  descriereScurta: string;
  descriereCompleta: string;
  pret?: string | null;
  durata?: string | null;
};
