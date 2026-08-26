/**
 * Cum se transformă textul scris într-o casetă în paragrafe pe site.
 *
 * Regula e una singură și se poate spune într-o propoziție: **fiecare rând nou e
 * un paragraf nou**. Nu markdown, nu editor cu butoane de îngroșat — un
 * psiholog care scrie despre anxietate n-are de ce să învețe o notație.
 *
 * Rândurile goale se aruncă, deci nu contează dacă apeși Enter o dată sau de
 * două ori: și una, și alta înseamnă „paragraf nou". Într-o casetă de text,
 * rândurile se rup singure la marginea ei fără să lase vreun caracter, așa că
 * fiecare rând din valoare e un Enter apăsat intenționat.
 *
 * Singura excepție e subtitlul, fiindcă un text de o mie de cuvinte fără
 * subtitluri e un zid — și pentru cititor, și pentru Google, care caută în ele
 * despre ce e pagina. `## ` la începutul rândului. Cine nu-l folosește
 * niciodată primește exact ce a scris.
 */

export type BlocText =
  | { tip: "subtitlu"; text: string }
  | { tip: "paragraf"; text: string };

/**
 * Două sau mai multe diez-uri la începutul rândului, cu sau fără spațiu după.
 *
 * Iertător intenționat: îndrumarea din panou spune „## și un spațiu", dar cine
 * uită spațiul a vrut clar un subtitlu — nimeni nu începe un paragraf cu „##"
 * din greșeală. Iar trei diez-uri e obiceiul altor unelte; le tratăm la fel,
 * fiindcă noi n-avem niveluri de subtitlu.
 */
const SUBTITLU = /^#{2,}\s*(.*)$/;

export function blocuriText(text: string): BlocText[] {
  const blocuri: BlocText[] = [];

  for (const rand of text.split("\n")) {
    const curat = rand.trim();
    if (curat === "") continue;

    const subtitlu = SUBTITLU.exec(curat);

    if (subtitlu) {
      const titlu = subtitlu[1].trim();
      // „## " singur pe rând nu e un subtitlu, e un rând început și abandonat.
      // Randat, ar ieși un titlu gol care ocupă spațiu fără să spună nimic.
      if (titlu !== "") blocuri.push({ tip: "subtitlu", text: titlu });
      continue;
    }

    blocuri.push({ tip: "paragraf", text: curat });
  }

  return blocuri;
}

/**
 * Câte cuvinte are textul.
 *
 * Orice grup de caractere despărțit de spații — inclusiv „14-16" sau „ex.:".
 * Nu încercăm să fim mai deștepți de-atât: numărul e o măsură a lungimii pentru
 * om, nu o statistică lingvistică, iar orice regulă mai fină ar da un rezultat
 * pe care nimeni nu l-ar putea verifica numărând pe ecran.
 */
export function numaraCuvinte(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Textul tăiat după atâtea cuvinte, cu tot ce e între ele păstrat întocmai —
 * rânduri noi, spații duble, „## " de la subtitluri.
 *
 * Tăiem la sfârșitul ultimului cuvânt care încape, nu la un număr de caractere:
 * altfel o lipire s-ar termina în mijlocul unui cuvânt.
 */
export function taieLaCuvinte(text: string, limita: number): string {
  if (limita <= 0) return "";

  const cuvinte = [...text.matchAll(/\S+/g)];
  if (cuvinte.length <= limita) return text;

  const ultimul = cuvinte[limita - 1];
  return text.slice(0, (ultimul.index ?? 0) + ultimul[0].length);
}

/**
 * Ce are voie să ajungă în casetă, când există o limită de cuvinte.
 *
 * Trei situații, fiindcă „nu mai poate scrie" înseamnă altceva la tastat decât
 * la lipit:
 *
 * 1. Sub limită — trece nemodificat.
 * 2. Peste limită, dar scăzând (sau ținând) numărul de cuvinte — trece.
 *    Fără regula asta, un text ajuns cumva peste limită (o valoare veche, o
 *    salvare dinaintea limitei) n-ar mai putea fi scurtat niciodată: orice
 *    apăsare de tastă ar fi fost respinsă, inclusiv Backspace.
 * 3. Peste limită și crescând — păstrăm cât încape. O lipire de 500 de cuvinte
 *    peste 2.800 intră cu primele 200, nu se pierde de tot.
 *
 * În cazul 3 mai e o subtilitate. Când tastezi o literă la limită, tăierea dă
 * exact textul de dinainte, fără spațiul de la coadă — iar dacă am accepta-o,
 * spațiul pe care tocmai l-ai pus ar dispărea și cursorul ar sări înapoi. Așa
 * că verificăm: dacă tăierea nu aduce nimic nou, lăsăm caseta exact cum e.
 */
export function opresteLaLimita(propus: string, actual: string, limita: number): string {
  const cuvintePropuse = numaraCuvinte(propus);
  if (cuvintePropuse <= limita) return propus;
  if (cuvintePropuse <= numaraCuvinte(actual)) return propus;

  const taiat = taieLaCuvinte(propus, limita);
  return taiat === actual.trimEnd() ? actual : taiat;
}

/** 200 de cuvinte pe minut — media pentru un text obișnuit în limba maternă. */
export const CUVINTE_PE_MINUT = 200;

/**
 * Cât durează cititul, în minute.
 *
 * Nu e o precizie de care depinde ceva; e felul în care cineva decide dacă
 * citește acum sau lasă pe seară. De asta rotunjim în sus și nu arătăm niciodată
 * „0 minute".
 */
export function minuteDeCitit(text: string): number {
  return Math.max(1, Math.round(numaraCuvinte(text) / CUVINTE_PE_MINUT));
}
