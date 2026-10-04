/**
 * Săptămâna Luni–Sâmbătă din grila de programare de la „Apropiere".
 *
 * DE CE EXISTĂ. Grila arăta „următoarele șase zile cu ore libere", în ordine
 * cronologică: marți, miercuri, joi, vineri, sâmbătă, apoi LUNI din săptămâna
 * următoare — la sfârșit. Proprietarul a cerut (5 oct. 2026) ca luni să fie
 * prima, iar ultima sâmbăta: o săptămână așa cum o știe oricine. Zilele fără ore
 * libere rămân în coloană, estompate, ca ordinea să nu se strice.
 *
 * Lucrează cu CHEI DE DATĂ ("2026-10-06", cum le dă `programari-publice`), nu cu
 * `Date` locale: ziua săptămânii se socotește în UTC din cheie, deci nu depinde de
 * fusul serverului sau al cititorului. Funcția stă într-un fișier fără nicio
 * dependență, ca Node s-o poată proba direct.
 */

/** Ziua săptămânii dintr-o cheie, cu luni = 0 … duminică = 6. */
function ziuaSaptamanii(cheie: string): number {
  const [an, luna, zi] = cheie.split("-").map(Number);
  return (new Date(Date.UTC(an, luna - 1, zi)).getUTCDay() + 6) % 7;
}

/** Cheia de dată cu `zile` adăugate (sau scăzute) la cea dată. */
function adauga(cheie: string, zile: number): string {
  const [an, luna, zi] = cheie.split("-").map(Number);
  return new Date(Date.UTC(an, luna - 1, zi + zile)).toISOString().slice(0, 10);
}

/**
 * Cele șase date, Luni → Sâmbătă, ale PRIMEI săptămâni care are cel puțin o zi
 * liberă între luni și sâmbătă. Listă goală dacă nu e nicio zi liberă într-un
 * asemenea interval — atunci grila cade pe lista simplă de zile.
 *
 * - Săptămâna e cea a primei zile libere: dacă prima e marți, se arată luni
 *   (fără ore, estompată) și restul săptămânii. O săptămână trecută nu se arată
 *   niciodată: zilele libere sunt, prin construcție, de azi încolo.
 * - Duminica nu intră în grilă (ultima zi e sâmbăta, cerut). O duminică liberă
 *   rămâne la „Vezi toate zilele libere" — și nu închide săptămâna: dacă
 *   singura zi liberă a unui interval e duminica, se trece la următorul interval
 *   care are o zi între luni și sâmbătă.
 *
 * `zileLibere` = cheile zilelor cu ore libere, în orice ordine.
 */
export function cheileSaptamanii(zileLibere: string[]): string[] {
  const luniDeSaptamana = zileLibere
    .filter((cheie) => ziuaSaptamanii(cheie) < 6)
    .map((cheie) => adauga(cheie, -ziuaSaptamanii(cheie)))
    .sort();

  if (luniDeSaptamana.length === 0) return [];

  const luni = luniDeSaptamana[0];
  return Array.from({ length: 6 }, (_, i) => adauga(luni, i));
}
