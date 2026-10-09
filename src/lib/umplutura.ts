/**
 * Textul de umplutură: instrucțiunile între paranteze drepte lăsate în locul unui
 * conținut care încă nu există — „[Aici vine părerea unui client adevărat…]",
 * „[Numele]", „[Cabinetul, orașul]".
 *
 * REGULA DE PLATFORMĂ (brief 9 oct. 2026, 1.2): un astfel de text nu se afișează
 * pe niciun site public. O secțiune care încă are umplutură în ea nu se randează
 * deloc pe site; în panou rămâne vizibilă, cu tot cu text, ca omul să vadă ce mai
 * are de completat. Pe sitepsihologi.ro, secțiunea „Păreri" a stat publică cu trei
 * astfel de instrucțiuni, iar un vizitator le citea ca pe niște păreri.
 *
 * Fără bază de date și fără DOM, ca să se poată proba în Node
 * (`e2e/umplutura.proba.mjs`).
 */

/**
 * E textul întreg o instrucțiune între paranteze drepte?
 *
 * ÎNTREG, nu „conține": „Ședința [online] durează o oră" e o frază a clientului,
 * cu paranteze puse de el; „[Numele]" e locul gol al unui nume. Spațiile de la
 * capete nu contează. Între paranteze trebuie să fie măcar o literă — „[ ]" sau
 * „[1]" nu sunt instrucțiuni pentru nimeni.
 */
export function esteUmplutura(text: string): boolean {
  const curat = text.trim();
  return curat.length > 2 && curat.startsWith("[") && curat.endsWith("]") && /\p{L}/u.test(curat);
}

/**
 * Are conținutul unei secțiuni (JSON-ul din `site_content.data`, de orice formă)
 * măcar un text de umplutură, oriunde în el — titlu, element de listă, autor?
 *
 * O singură umplutură ajunge ca secțiunea să nu se randeze: altfel ar trebui ghicit
 * ce parte a secțiunii mai are sens fără ea, iar o părere fără autor sau un autor
 * fără părere arată la fel de stricat ca instrucțiunea însăși.
 */
export function contineUmplutura(continut: unknown): boolean {
  if (typeof continut === "string") return esteUmplutura(continut);
  if (Array.isArray(continut)) return continut.some(contineUmplutura);
  if (typeof continut === "object" && continut !== null) {
    return Object.values(continut).some(contineUmplutura);
  }
  return false;
}

/**
 * Bucățile de text de umplutură din HTML-ul unei pagini publice — pentru
 * verificarea automată (`scripts/verifica-umplutura.mjs`), nu pentru randare.
 *
 * Caută în TEXTUL care se vede: scripturile (datele structurate sunt JSON, plin de
 * paranteze drepte legitime), stilurile și etichetele se scot întâi. Prinde și o
 * umplutură lipită de alt text („[Numele] · [Cabinetul, orașul]"), nu doar una
 * singură într-un element: verificarea e plasa de siguranță a regulii, deci e mai
 * largă decât regula.
 *
 * Doar paranteze care încep cu MAJUSCULĂ — așa arată toate instrucțiunile scrise
 * de noi („[Aici…", „[Numele]", „[CÂTE LUNI]"). Un „[online]" scris de client în
 * mijlocul unei fraze nu e umplutură și n-ar trebui să pice verificarea.
 */
export function umpluturaInHtml(html: string): string[] {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

  return [...text.matchAll(/\[\p{Lu}[^\[\]]*\]/gu)].map((potrivire) => potrivire[0]);
}
