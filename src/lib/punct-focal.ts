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

export type PunctFocal = {
  x: number;
  y: number;
  /**
   * Cât e MĂRITĂ poza față de cât îi trebuie ca să umple rama. 1 = deloc
   * (purtarea dintotdeauna), 2 = de două ori.
   *
   * De ce există. `object-fit: cover` micșorează poza exact cât s-o încapă în
   * ramă, deci pe una dintre axe o potrivește fix — iar pe axa aia nu mai e
   * nimic ascuns de adus în cadru. O poză lată într-o ramă verticală nu se
   * poate mișca deloc sus-jos: deasupra și dedesubt nu există nimic.
   *
   * Proprietarul a cerut, pe bună dreptate, să poată muta poza pe amândouă
   * direcțiile (1 oct. 2026). Singurul fel în care asta are sens e să poată
   * mări poza: din clipa în care e mai mare decât rama, îi prisosește pe
   * amândouă axele, deci se poate trage în toate părțile.
   *
   * Călătorește cu punctul focal, nu separat, dintr-un motiv practic: `pozitie`
   * e deja dus până la fiecare ramă de pe site (zece locuri). Un câmp nou,
   * paralel, ar fi cerut atinse toate zece și uitat la al unsprezecelea.
   */
  zoom?: number;
};

/** Cât se poate mări o poză. Peste atât se vede doar pixelul, nu poza. */
export const ZOOM_MINIM = 1;
export const ZOOM_MAXIM = 3;

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

  const zoom = normalizeazaZoom((brut as Record<string, unknown>).zoom);

  // `zoom` lipsește din rezultat când e 1: așa, pozele nemărite rămân în date
  // exact ca înainte, iar o comparație „s-a schimbat ceva?" nu se aprinde
  // degeaba la fiecare deschidere a formularului.
  return zoom === ZOOM_MINIM ? { x, y } : { x, y, zoom };
}

/**
 * Un zoom valid: număr finit, adus între 1 și 3, rotunjit la două zecimale.
 * Orice altceva (lipsă, text, `NaN`, 0) devine 1 — adică poza nemărită, exact
 * purtarea de dinainte de 1 oct. 2026.
 */
export function normalizeazaZoom(brut: unknown): number {
  if (typeof brut !== "number" || !Number.isFinite(brut)) return ZOOM_MINIM;
  const marginit = Math.min(ZOOM_MAXIM, Math.max(ZOOM_MINIM, brut));
  return Math.round(marginit * 100) / 100;
}

/** Valoarea pentru `transform`. Fără mărire → `none`, ca să nu punem un strat de compunere degeaba. */
export function scaraImaginii(punct: unknown): string | undefined {
  const zoom = normalizeazaZoom(normalizeazaPunctFocal(punct).zoom);
  return zoom === ZOOM_MINIM ? undefined : `scale(${zoom})`;
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
/**
 * Cât IESE poza din ramă pe fiecare axă, în pixeli, ținând cont și de mărire.
 *
 * Fără mărire, `object-fit: cover` potrivește fix una dintre axe, iar pe aia
 * surplusul e zero — adică nu se poate trage. Mărirea face surplusul pozitiv pe
 * amândouă, și de-aia poza devine mișcabilă în toate direcțiile.
 *
 * Pură, ca s-o putem proba cu Node: mărimile ramei și ale fișierului le măsoară
 * componenta din browser și le dă ca argumente.
 */
export function surplusulPozei(masuri: {
  latimeRama: number;
  inaltimeRama: number;
  latimeFisier: number;
  inaltimeFisier: number;
  zoom?: number;
}): { surplusX: number; surplusY: number } {
  const { latimeRama, inaltimeRama, latimeFisier, inaltimeFisier } = masuri;
  if (
    latimeFisier <= 0 ||
    inaltimeFisier <= 0 ||
    latimeRama <= 0 ||
    inaltimeRama <= 0
  ) {
    return { surplusX: 0, surplusY: 0 };
  }

  const zoom = normalizeazaZoom(masuri.zoom);
  const scala =
    Math.max(latimeRama / latimeFisier, inaltimeRama / inaltimeFisier) * zoom;

  return {
    surplusX: latimeFisier * scala - latimeRama,
    surplusY: inaltimeFisier * scala - inaltimeRama,
  };
}

export function dupaTragere(
  start: PunctFocal,
  deplasare: { dx: number; dy: number; surplusX: number; surplusY: number },
): PunctFocal {
  const { dx, dy, surplusX, surplusY } = deplasare;

  const x = surplusX > 0 ? start.x - (dx / surplusX) * 100 : start.x;
  const y = surplusY > 0 ? start.y - (dy / surplusY) * 100 : start.y;

  // Mărirea merge mai departe neatinsă: tragerea mută cadrul, nu-l apropie.
  return normalizeazaPunctFocal({ x, y, zoom: start.zoom });
}
