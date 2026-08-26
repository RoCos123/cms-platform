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
 * Cât durează cititul, în minute. 200 de cuvinte pe minut e media pentru un text
 * obișnuit în limba maternă.
 *
 * Nu e o precizie de care depinde ceva; e felul în care cineva decide dacă
 * citește acum sau lasă pe seară. De asta rotunjim în sus și nu arătăm niciodată
 * „0 minute".
 */
export function minuteDeCitit(text: string): number {
  const cuvinte = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cuvinte / 200));
}
