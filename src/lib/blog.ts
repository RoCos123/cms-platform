import type { CampSchema } from "@/lib/sectiuni";

/**
 * Un articol de blog, așa cum îl scrie clientul și cum îl citește site-ul.
 *
 * Ca la servicii: se scrie o singură dată, aici. Cartonașul de pe prima pagină
 * ia titlul, extrasul și coperta; pagina articolului le ia pe toate. Nimic nu se
 * scrie de două ori, deci nimic nu se poate contrazice.
 */

export const CAMPURI_ARTICOL: CampSchema[] = [
  {
    tip: "text",
    cheie: "title",
    eticheta: "Titlul articolului",
    hint: "Ce vede omul în listă și în Google. Scrie-l ca pentru cineva care caută ajutor, nu ca pe un titlu de lucrare.",
    obligatoriu: true,
    max: 160,
  },
  {
    tip: "slug",
    cheie: "slug",
    dinCheia: "title",
    prefix: "/blog/",
    eticheta: "Adresa articolului",
    hint: "Se completează singură din titlu. O schimbi doar dacă ai un motiv — adresa veche nu mai duce nicăieri după aceea.",
    obligatoriu: true,
    max: 100,
  },
  {
    tip: "textLung",
    cheie: "excerpt",
    eticheta: "Despre ce e, pe scurt",
    hint: "Două rânduri, atât. Apar pe cartonașul din listă și sub titlul albastru din Google — de multe ori e singurul lucru citit înainte de a intra.",
    obligatoriu: true,
    randuri: 3,
    max: 300,
  },
  {
    tip: "imagine",
    cheie: "coperta",
    eticheta: "Imaginea articolului",
    hint: "Opțională. Apare sus pe pagina articolului și pe cartonașul din listă. Merge cel mai bine una lată.",
  },
  {
    tip: "textLung",
    cheie: "content",
    eticheta: "Articolul",
    hint: "Apasă Enter pentru un paragraf nou. Dacă vrei un subtitlu, începe rândul cu ## și un spațiu — ex.: „## Ce poți face acum”.",
    obligatoriu: true,
    randuri: 18,
    max: 20000,
  },
];

/**
 * Un articol așa cum apare într-o listă: tot ce încape pe un cartonaș.
 *
 * Fără textul întreg, intenționat. Prima pagină arată trei cartonașe; dacă
 * forma asta ar fi purtat și conținutul, fiecare vizitator ar fi descărcat toate
 * articolele cabinetului ca să vadă trei titluri.
 */
export type ArticolListat = {
  id: string;
  slug: string;
  titlu: string;
  extras: string;
  /** Dată ISO; se formatează abia la afișare. `null` = încă nepublicat. */
  publicatLa: string | null;
  coperta?: { url: string; altText: string } | null;
};

/** Articolul întreg — doar pagina lui are nevoie de asta. */
export type Articol = ArticolListat & { continut: string };

const FORMAT_DATA = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formateazaDataArticolului(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : FORMAT_DATA.format(data);
}
