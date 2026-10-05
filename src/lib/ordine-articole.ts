/**
 * Ordinea articolelor de blog: ce se scrie în bază când un articol e mutat mai
 * sus sau mai jos, și ce poziție primește unul nou.
 *
 * DE CE E ÎNTR-UN FIȘIER FĂRĂ DEPENDENȚE. Regula de mai jos e partea care poate
 * strica tăcut ordinea de pe site, iar acțiunea de pe server (Supabase, sesiune)
 * nu se poate rula din Node. Aici stă doar aritmetica, ca să se poată proba pe
 * ea însăși — acțiunea doar o cheamă.
 *
 * Ordinea se citește în trei locuri (panoul, blogul public, acțiunea de mutare) și trebuie să fie ACEEAȘI peste tot,
 * altfel „mută mai sus" ar face în panou altceva decât pe site (probat în
 * `e2e/ordine-articole.proba.mjs`): poziția crescător, apoi data publicării
 * (cele mai noi întâi, cele fără dată la coadă), apoi data creării.
 */

export type Directie = "sus" | "jos";

export type RandOrdine = { id: string; position: number };

/** Pasul dintre poziții: loc între ele, ca să nu se rescrie totul la fiecare mutare. */
export const PAS_POZITIE = 10;

/**
 * Poziția unui articol nou: înaintea tuturor, deci „cel mai nou primul" rămâne
 * purtarea implicită. `minima` e cea mai mică poziție de pe site, sau `null`
 * dacă nu există niciun articol.
 */
export function pozitiaArticoluluiNou(minima: number | null): number {
  return minima === null ? 0 : minima - PAS_POZITIE;
}

/**
 * Mută articolul `id` cu o treaptă în lista `randuri` (deja în ordinea de pe
 * site). Întoarce noua ordine de id-uri și pozițiile de scris, sau `null` dacă
 * nu e nimic de făcut: articolul nu e în listă, sau e deja primul/ultimul.
 *
 * Pozițiile se RENUMEROTEAZĂ pentru toată lista (10, 20, 30…), nu se schimbă
 * între ele doar cele două vecine. Schimbul între doi vecini e corect doar cât
 * timp pozițiile sunt distincte; la egalitate (rândurile seedate au toate 0)
 * un al treilea articol cu aceeași poziție ar fi putut sări peste unul dintre ei
 * la departajare. Renumerotarea nu are cazul ăsta, iar `scrieri` conține doar
 * rândurile a căror poziție chiar se schimbă — de obicei două.
 */
export function mutaArticol(
  randuri: RandOrdine[],
  id: string,
  directie: Directie,
): { ordine: string[]; scrieri: RandOrdine[] } | null {
  const index = randuri.findIndex((rand) => rand.id === id);
  if (index === -1) return null;

  const destinatie = directie === "sus" ? index - 1 : index + 1;
  if (destinatie < 0 || destinatie >= randuri.length) return null;

  const ordine = randuri.map((rand) => rand.id);
  [ordine[index], ordine[destinatie]] = [ordine[destinatie], ordine[index]];

  const pozitieAnterioara = new Map(randuri.map((rand) => [rand.id, rand.position]));
  const scrieri = ordine
    .map((idRand, i) => ({ id: idRand, position: (i + 1) * PAS_POZITIE }))
    .filter((rand) => pozitieAnterioara.get(rand.id) !== rand.position);

  return { ordine, scrieri };
}

/** Aceeași mutare, pe orice listă de rânduri cu `id` — pentru panou, înainte de răspunsul serverului. */
export function mutaInLista<T extends { id: string }>(
  lista: T[],
  id: string,
  directie: Directie,
): T[] | null {
  const mutat = mutaArticol(
    lista.map((rand, i) => ({ id: rand.id, position: i })),
    id,
    directie,
  );
  if (!mutat) return null;

  const dupaId = new Map(lista.map((rand) => [rand.id, rand]));
  return mutat.ordine.map((idRand) => dupaId.get(idRand)!);
}
