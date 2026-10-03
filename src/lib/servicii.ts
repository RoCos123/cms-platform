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
    hint: "Cui se adresează, cum decurge, la ce să se aștepte. Începutul apare pe cartonașul din prima pagină (cât încape în patru rânduri — îl vezi în dreapta); textul întreg, pe pagina de servicii.",
    obligatoriu: true,
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
  {
    tip: "imagine",
    cheie: "coperta",
    eticheta: "Poză",
    hint: "Opțională. Apare pe cartonașul serviciului și sus pe pagina lui. Fără ea, cartonașul arată ca înainte, doar cu text.",
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
  /**
   * Poza serviciului, dacă are una. Adresa e semnată din `cover_upload_id` la
   * citire (ca la coperțile de blog); lipsă = cartonașul rămâne doar text.
   */
  coperta?: { url: string } | null;
};

/**
 * Rezumatul de pe cartonașul din prima pagină, scos AUTOMAT din descriere.
 *
 * Clientul scrie o singură descriere, text simplu (fără `##`); cartonașul ia
 * primul ei rând. Se salvează în coloana `excerpt`, de unde cartonașul citea și
 * înainte — deci randarea nu se schimbă, doar sursa.
 *
 * `subtitluri: false` ca și la randare: un `##` rămas din greșeală se tratează
 * ca text simplu, nu se sare peste el. Tăiat la o margine de cuvânt, cu „…", ca
 * să nu rupă un cuvânt în două. Node îl poate proba direct: text curat, fără
 * bază de date, fără JSX.
 */
export function rezumatServiciu(descriere: string, maxCaractere = 200): string {
  const primulParagraf = blocuriText(descriere, { subtitluri: false }).find(
    (b) => b.tip === "paragraf",
  );
  const text = (primulParagraf?.text ?? "").trim();

  if (text.length <= maxCaractere) return text;

  const taiat = text.slice(0, maxCaractere).replace(/\s+\S*$/, "").trimEnd();
  return `${taiat}…`;
}

/**
 * Câte rânduri de descriere încap pe cartonașul din prima pagină.
 *
 * DE CE UN NUMĂR FIX DE RÂNDURI. Până pe 3 oct. 2026 cartonașul arăta doar
 * PRIMUL RÂND al descrierii — iar o descriere care începea cu „…depistarea
 * următoarelor:" și continua cu o listă se oprea în aer, la două puncte.
 * Proprietarul a cerut: cartonașele de aceeași mărime, textul tăiat, „Citește
 * mai mult" sub el, și tăierea VIZIBILĂ în panou cât scrii, ca să știi cât
 * încape. Un număr fix de rânduri face toate trei: aceeași înălțime pentru
 * text pe fiecare cartonaș, iar tăierea e aceeași în previzualizare și pe site,
 * fiindcă o face browserul, pe lățimea reală a cartonașului.
 */
export const RANDURI_CARTONAS = 4;

/**
 * Textul de pe cartonaș: TOATĂ descrierea, rând sub rând, cum a scris-o
 * clientul — fără rândurile goale dintre paragrafe, care ar mânca din cele
 * patru rânduri fără să arate nimic. Tăierea propriu-zisă la `RANDURI_CARTONAS`
 * o face CSS-ul, pe lățimea cartonașului.
 *
 * Plafonul în caractere e doar ca să nu ajungă în pagină o descriere de 12.000
 * de caractere din care se văd patru rânduri. E mult peste ce încape în patru
 * rânduri chiar pe un cartonaș lat cât tot ecranul.
 *
 * Descrierea lungă lipsește la conținutul vechi, scris doar ca rezumat — atunci
 * se ia rezumatul.
 */
export function textCartonas(
  serviciu: Pick<Serviciu, "descriereCompleta" | "descriereScurta">,
  maxCaractere = 800,
): string {
  const sursa = serviciu.descriereCompleta?.trim() ? serviciu.descriereCompleta : serviciu.descriereScurta ?? "";
  const text = blocuriText(sursa, { subtitluri: false })
    .map((b) => b.text.trim())
    .filter(Boolean)
    .join("\n");

  if (text.length <= maxCaractere) return text;

  return `${text.slice(0, maxCaractere).replace(/\s+\S*$/, "").trimEnd()}…`;
}

/**
 * Lista de servicii pentru previzualizarea „Cum arată pe prima pagină" din
 * editorul unui serviciu: cele publicate, cu serviciul editat pus în locul lui —
 * cu ce e scris ACUM în formular, nesalvat.
 *
 * Lățimea unui cartonaș depinde de câte sunt pe rând, iar unde se taie textul
 * depinde de lățime. De-aia se arată toată secțiunea, cu vecinii adevărați, nu
 * un cartonaș singur: unul singur s-ar întinde pe tot rândul și ar tăia altfel
 * decât pe site.
 *
 * Când serviciul NU apare pe prima pagină (e ciornă, sau e dincolo de „câte se
 * văd"), ia locul ultimului cartonaș vizibil — numărul de cartonașe rămâne,
 * deci și lățimea lor — iar `motiv` spune de ce pe site nu e acolo.
 */
export function serviciiPentruPrevizualizare(
  publicate: Serviciu[],
  editat: Serviciu,
  /** Câte se văd pe prima pagină; `undefined` = toate. */
  numar: number | undefined,
): { servicii: Serviciu[]; motiv: "ciorna" | "dincoloDeNumar" | null } {
  const index = publicate.findIndex((s) => s.id === editat.id);

  if (index === -1) {
    const vizibile = numar ? publicate.slice(0, numar) : publicate;
    // Ciornă: n-are încă loc pe site. Ia locul ultimului vizibil, sau se adaugă
    // dacă mai e loc.
    const servicii =
      numar && vizibile.length >= numar ? [...vizibile.slice(0, numar - 1), editat] : [...vizibile, editat];
    return { servicii, motiv: "ciorna" };
  }

  const servicii = publicate.map((s) => (s.id === editat.id ? editat : s));

  if (numar && index >= numar) {
    return { servicii: [...servicii.slice(0, numar - 1), editat], motiv: "dincoloDeNumar" };
  }

  return { servicii, motiv: null };
}
