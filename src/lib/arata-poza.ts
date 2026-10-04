/**
 * „Arată-mi poza pe care o așez": legătura dintre rama de poziționare din
 * formular și previzualizarea din dreapta.
 *
 * DE CE EXISTĂ. Pe ecran lat, previzualizarea stă lipită sus cât derulezi
 * formularul. La un hero înalt (Căldură: titlu mare, apoi poza lată dedesubt)
 * ea iese mai înaltă decât ecranul, iar poza rămânea sub marginea de jos — omul
 * trăgea de ea în formular fără s-o vadă mișcându-se (prins de proprietar,
 * 4 oct. 2026). Acum previzualizarea se poate derula, iar când tragi de o poză
 * sau îi schimbi mărimea, se derulează singură până la ea.
 *
 * Un eveniment pe `window`, nu un context React: rama și previzualizarea stau
 * în ramuri diferite ale paginii (formularul și panoul din dreapta), iar
 * formularul e folosit în patru editoare. Un eveniment le leagă fără să treacă
 * prin fiecare dintre ele.
 */
export const EVENIMENT_ARATA_POZA = "previzualizare:arata-poza";

/** Cere previzualizării să aducă în vedere poza cu adresa `src`. */
export function cereSaSeVadaPoza(src: string): void {
  if (typeof window === "undefined" || !src) return;
  window.dispatchEvent(new CustomEvent(EVENIMENT_ARATA_POZA, { detail: { src } }));
}

/**
 * Cât trebuie derulată previzualizarea ca poza să ajungă în vedere, sau `null`
 * dacă se vede deja întreagă (atunci nu se mișcă nimic — o fereastră care sare
 * la fiecare pixel tras ar fi mai rea decât problema).
 *
 * Toate valorile sunt în pixelii ferestrei derulabile, deja la scară.
 */
export function tintaDerulare({
  sus,
  inaltime,
  derulareAcum,
  inaltimeFereastra,
}: {
  /** Unde începe poza, măsurat de la începutul conținutului derulabil. */
  sus: number;
  inaltime: number;
  /** Cât e derulată fereastra acum. */
  derulareAcum: number;
  /** Cât se vede din fereastră. */
  inaltimeFereastra: number;
}): number | null {
  const seVedeIntreaga = sus >= derulareAcum && sus + inaltime <= derulareAcum + inaltimeFereastra;
  if (seVedeIntreaga) return null;

  // Poza mai înaltă decât fereastra: i se aliniază începutul, ca să se vadă
  // măcar partea de sus. Altfel, centrată.
  if (inaltime >= inaltimeFereastra) return Math.max(0, Math.round(sus));
  return Math.max(0, Math.round(sus + inaltime / 2 - inaltimeFereastra / 2));
}
