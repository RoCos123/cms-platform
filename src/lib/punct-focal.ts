/**
 * Punctul focal al unei imagini: ce parte trebuie să rămână mereu în cadru.
 *
 * Pe site, o poză se afișează des tăiată la altă formă decât cea încărcată
 * (`object-fit: cover`): un portret vertical pus într-o ramă pătrată pierde ceva
 * sus sau jos. Din oficiu, browserul taie simetric, de la centru — și taie exact
 * fața, dacă e mai sus în cadru. Punctul focal spune „ține ASTA în cadru", iar la
 * afișare devine `object-position`.
 *
 * Coordonate în procente, 0–100, din colțul stânga-sus: `{x:50,y:50}` e centrul
 * (purtarea implicită a browserului). Procente, nu pixeli: aceeași poză se
 * afișează la mărimi diferite pe telefon și pe ecran lat, iar un procent
 * înseamnă același loc în toate.
 *
 * Logică pură, probată cu Node fără browser (`e2e/punct-focal.proba.mjs`).
 */

export type PunctFocal = { x: number; y: number };

/** Centrul — ce face browserul din oficiu, deci și ce presupunem când nu s-a ales nimic. */
export const PUNCT_FOCAL_IMPLICIT: PunctFocal = { x: 50, y: 50 };

/** Un procent valid: număr finit, adus în 0–100 și rotunjit. Altfel, `null`. */
function inProcent(valoare: unknown): number | null {
  if (typeof valoare !== "number" || !Number.isFinite(valoare)) return null;
  // Rotunjit la întreg: un procent e destul de fin pentru un punct focal, iar
  // „50" e mai ușor de citit în date decât „49.7381".
  return Math.min(100, Math.max(0, Math.round(valoare)));
}

/**
 * Curăță un punct focal venit din conținut. Panoul scrie valori bune, dar în
 * JSON poate ajunge și ceva scris de mână sau rămas dintr-o versiune veche: un
 * `x` lipsă, `y: NaN` sau `x: 99999` ar produce altfel un `object-position` fără
 * sens. Orice nu e un punct întreg valid devine centrul.
 */
export function normalizeazaPunctFocal(brut: unknown): PunctFocal {
  if (typeof brut !== "object" || brut === null) return PUNCT_FOCAL_IMPLICIT;

  const x = inProcent((brut as Record<string, unknown>).x);
  const y = inProcent((brut as Record<string, unknown>).y);
  if (x === null || y === null) return PUNCT_FOCAL_IMPLICIT;

  return { x, y };
}

/**
 * Valoarea pentru `object-position`. Un punct lipsă (ori nevalid) → „50% 50%",
 * adică exact purtarea de dinainte: pozele fără punct focal ales rămân
 * neschimbate, iar o valoare stricată nu poate dărâma afișarea la vizitator.
 */
export function pozitiaImaginii(punct: unknown): string {
  const p = normalizeazaPunctFocal(punct);
  return `${p.x}% ${p.y}%`;
}

/**
 * Noul punct focal după ce omul a TRAS de imagine cu `dx`/`dy` pixeli — ca la
 * Facebook, unde muți poza în ramă, nu pui un punct.
 *
 * `object-position` se măsoară pe cât de mult IESE imaginea din ramă
 * (`surplus`): la 0% se vede marginea din stânga/sus, la 100% cea din
 * dreapta/jos. A trage imaginea la dreapta (`dx > 0`) dezvelește stânga, deci
 * procentul SCADE — de aici minusul. Pe axa unde imaginea încape fix (surplus
 * 0) nu e nimic de mutat, deci procentul rămâne.
 *
 * Se pleacă de la valoarea de la ÎNCEPUTUL tragerii plus deplasarea totală, nu
 * pas cu pas: altfel rotunjirile s-ar aduna și punctul ar aluneca singur.
 *
 * Logică pură (fără DOM), ca s-o putem proba cu Node — surplusul îl măsoară
 * componenta din browser și îl dă ca argument.
 */
export function dupaTragere(
  start: PunctFocal,
  deplasare: { dx: number; dy: number; surplusX: number; surplusY: number },
): PunctFocal {
  const { dx, dy, surplusX, surplusY } = deplasare;

  const x = surplusX > 0 ? start.x - (dx / surplusX) * 100 : start.x;
  const y = surplusY > 0 ? start.y - (dy / surplusY) * 100 : start.y;

  return normalizeazaPunctFocal({ x, y });
}
