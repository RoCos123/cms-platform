import type { CampSchema } from "@/lib/sectiuni";
import { blocuriText } from "@/lib/blocuri-text";

/**
 * Un serviciu, așa cum îl scrie clientul.
 *
 * Se scrie O SINGURĂ DATĂ, aici: un NUME și o DESCRIERE, atât. Cartonașul de pe
 * prima pagină ia numele și își scoate SINGUR un rezumat din primul rând al
 * descrierii (vezi `rezumatServiciu`); pagina de servicii ia descrierea
 * întreagă. Clientul nu mai scrie un „scurt" și un „lung" care se contrazic
 * peste trei luni — hotărât cu proprietarul pe 10 sept. 2026, după ce cele două
 * casete de descriere l-au încurcat la primul lui site.
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
    cheie: "content",
    eticheta: "Descriere",
    hint: "Cui se adresează, cum decurge, la ce să se aștepte. Primul rând apare pe cartonașul din prima pagină; textul întreg, pe pagina de servicii.",
    obligatoriu: true,
    randuri: 10,
    cuSubtitluri: true,
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

/**
 * Rezumatul de pe cartonașul din prima pagină, scos AUTOMAT din descriere.
 *
 * Clientul scrie o singură descriere; cartonașul ia primul PARAGRAF al ei,
 * sărind peste un eventual subtitlu de la început (`## Cum decurge` n-are ce
 * căuta pe un cartonaș de două rânduri). Se salvează în coloana `excerpt`, de
 * unde cartonașul citea și înainte — deci randarea nu se schimbă, doar sursa.
 *
 * Tăiat la o margine de cuvânt, cu „…", ca să nu rupă un cuvânt în două. Node
 * îl poate proba direct: e text curat, fără bază de date, fără JSX.
 */
export function rezumatServiciu(descriere: string, maxCaractere = 200): string {
  const primulParagraf = blocuriText(descriere).find((b) => b.tip === "paragraf");
  const text = (primulParagraf?.text ?? "").trim();

  if (text.length <= maxCaractere) return text;

  const taiat = text.slice(0, maxCaractere).replace(/\s+\S*$/, "").trimEnd();
  return `${taiat}…`;
}
