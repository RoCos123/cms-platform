/**
 * Ordinea articolelor de blog: ce se scrie în bază când un articol e mutat (tras
 * în listă sau cu săgețile), și ce poziție primește unul nou.
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
 * Mută articolul `id` ÎNAINTEA articolului `inaintea` (sau la sfârșit, dacă
 * `inaintea` e `null`), în lista `randuri` deja în ordinea de pe site. Întoarce
 * noua ordine de id-uri și pozițiile de scris, sau `null` dacă nu e nimic de
 * făcut: id necunoscut, țintă necunoscută sau chiar articolul însuși, ori
 * articolul ar rămâne exact unde e.
 *
 * „Înaintea cuiva", nu „la indexul N": un panou rămas deschis mult are o listă
 * veche, iar un index ar fi picat pe alt articol. Cu o țintă numită, mutarea
 * înseamnă același lucru și pe lista veche, și pe cea de acum.
 *
 * Pozițiile se RENUMEROTEAZĂ pentru toată lista (10, 20, 30…), nu se schimbă
 * între ele doar două. Un schimb e corect doar cât timp pozițiile sunt distincte;
 * la egalitate (rândurile seedate au toate 0) un al treilea articol cu aceeași
 * poziție ar fi putut sări peste unul dintre ei la departajare. Renumerotarea nu
 * are cazul ăsta, iar `scrieri` conține doar rândurile a căror poziție chiar se
 * schimbă — la o mutare cu o treaptă, de obicei două.
 */
export function mutaInaintea(
  randuri: RandOrdine[],
  id: string,
  inaintea: string | null,
): { ordine: string[]; scrieri: RandOrdine[] } | null {
  if (!randuri.some((rand) => rand.id === id)) return null;
  if (inaintea !== null && (inaintea === id || !randuri.some((rand) => rand.id === inaintea))) {
    return null;
  }

  const ceilalti = randuri.map((rand) => rand.id).filter((idRand) => idRand !== id);
  const loc = inaintea === null ? ceilalti.length : ceilalti.indexOf(inaintea);
  const ordine = [...ceilalti.slice(0, loc), id, ...ceilalti.slice(loc)];

  if (ordine.every((idRand, i) => idRand === randuri[i].id)) return null;

  const pozitieAnterioara = new Map(randuri.map((rand) => [rand.id, rand.position]));
  const scrieri = ordine
    .map((idRand, i) => ({ id: idRand, position: (i + 1) * PAS_POZITIE }))
    .filter((rand) => pozitieAnterioara.get(rand.id) !== rand.position);

  return { ordine, scrieri };
}

/**
 * Ținta unei mutări cu o treaptă (săgețile de la tastatură): înaintea cărui
 * articol trebuie pus `id` ca să urce sau să coboare un loc. `undefined` dacă nu
 * se poate (necunoscut, deja primul/ultimul); `null` înseamnă „la sfârșit".
 */
export function tintaPentruPas(
  ids: string[],
  id: string,
  directie: Directie,
): string | null | undefined {
  const index = ids.indexOf(id);
  if (index === -1) return undefined;
  if (directie === "sus") return index === 0 ? undefined : ids[index - 1];
  if (index === ids.length - 1) return undefined;
  return ids[index + 2] ?? null;
}

/** Aceeași mutare, pe orice listă de rânduri cu `id` — pentru panou, înainte de răspunsul serverului. */
export function mutaInLista<T extends { id: string }>(
  lista: T[],
  id: string,
  inaintea: string | null,
): T[] | null {
  const mutat = mutaInaintea(
    lista.map((rand, i) => ({ id: rand.id, position: i })),
    id,
    inaintea,
  );
  if (!mutat) return null;

  const dupaId = new Map(lista.map((rand) => [rand.id, rand]));
  return mutat.ordine.map((idRand) => dupaId.get(idRand)!);
}

/**
 * Unde cade un rând tras: câte dintre CELELALTE rânduri au mijlocul mai sus decât
 * centrul rândului tras. Rezultatul e locul în lista fără rândul tras (0 = primul,
 * `mijloace.length` = ultimul), adică exact „înaintea celui de pe locul ăsta".
 *
 * Se compară cu MIJLOACELE vecinilor, nu cu marginile: rândul trece peste un vecin
 * abia când i-a depășit jumătatea, deci nu sare la prima atingere, iar rândurile
 * de înălțimi diferite (titluri pe două linii) se poartă la fel.
 */
export function locDeLasare(mijloace: number[], centru: number): number {
  return mijloace.filter((mijloc) => mijloc < centru).length;
}
